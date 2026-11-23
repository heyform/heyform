import { SubmissionCategoryEnum } from '@heyform-inc/shared-types-enums'
import {
  Controller,
  Delete,
  Get,
  MethodNotAllowedException,
  Post,
  Req,
  Res,
  UseGuards
} from '@nestjs/common'
import type { Response } from 'express'
import { z } from 'zod'

import { ApiPrincipal, ApiRequest, RestApiKeyGuard } from './rest-api-key.guard'
import { RestApiService } from './rest-api.service'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { Logger } from '@utils'

import { toClientException } from '../common/filter'

type McpTool = {
  name: string
  description: string
  input?: z.ZodRawShape
  readOnly?: boolean
  // Only adds or restores data; every other write is treated as destructive.
  additive?: boolean
  run: (api: RestApiService, principal: ApiPrincipal, args: any) => Promise<unknown>
}

const workspaceId = z.string().describe('Workspace ID')
const projectId = z.string().describe('Project ID')
const formId = z.string().describe('Form ID')
const submissionId = z.string().describe('Submission ID')
const name = z.string().describe('Name (1-100 characters)')

const TOOLS: McpTool[] = [
  {
    name: 'get_current_user',
    description: 'Get the user who owns the API key.',
    readOnly: true,
    run: (api, principal) => api.getCurrentUser(principal)
  },
  {
    name: 'get_user',
    description: 'Get a user who shares a workspace with the API key owner.',
    input: { userId: z.string().describe('User ID') },
    readOnly: true,
    run: (api, principal, { userId }) => api.getUser(principal, userId)
  },
  {
    name: 'list_workspaces',
    description: 'List workspaces the API key can access.',
    readOnly: true,
    run: (api, principal) => api.workspaces(principal)
  },
  {
    name: 'get_workspace',
    description: 'Get a workspace.',
    input: { workspaceId },
    readOnly: true,
    run: (api, principal, args) => api.getWorkspace(principal, args.workspaceId)
  },
  {
    name: 'rename_workspace',
    description: 'Rename a workspace.',
    input: { workspaceId, name },
    run: (api, principal, args) =>
      api.updateWorkspace(principal, args.workspaceId, { name: args.name })
  },
  {
    name: 'list_projects',
    description: 'List projects in a workspace.',
    input: { workspaceId },
    readOnly: true,
    run: (api, principal, args) => api.listProjects(principal, args.workspaceId)
  },
  {
    name: 'create_project',
    description: 'Create a project in a workspace.',
    input: { workspaceId, name },
    additive: true,
    run: (api, principal, args) =>
      api.createProject(principal, args.workspaceId, { name: args.name })
  },
  {
    name: 'rename_project',
    description: 'Rename a project.',
    input: { projectId, name },
    run: (api, principal, args) => api.renameProject(principal, args.projectId, { name: args.name })
  },
  {
    name: 'list_members',
    description: 'List members of a workspace.',
    input: { workspaceId },
    readOnly: true,
    run: (api, principal, args) => api.listMembers(principal, args.workspaceId)
  },
  {
    name: 'invite_members',
    description: 'Invite people to a workspace by email.',
    input: { workspaceId, emails: z.array(z.string()).describe('1-20 email addresses') },
    run: (api, principal, args) =>
      api.inviteMembers(principal, args.workspaceId, { emails: args.emails })
  },
  {
    name: 'remove_member',
    description: 'Remove a member from a workspace.',
    input: { workspaceId, userId: z.string().describe('User ID of the member') },
    run: (api, principal, args) => api.removeMember(principal, args.workspaceId, args.userId)
  },
  {
    name: 'list_forms',
    description: 'List forms in a project.',
    input: { projectId },
    readOnly: true,
    run: (api, principal, args) => api.listForms(principal, args.projectId)
  },
  {
    name: 'get_form',
    description:
      'Get a form, including published fields, drafts, logics, theme and version. Read it before editing drafts.',
    input: { formId },
    readOnly: true,
    run: (api, principal, args) => api.getForm(principal, args.formId)
  },
  {
    name: 'create_form',
    description: 'Create an unpublished form in a project.',
    input: { projectId, name },
    additive: true,
    run: (api, principal, args) => api.createForm(principal, args.projectId, { name: args.name })
  },
  {
    name: 'rename_form',
    description: 'Rename a form.',
    input: { formId, name },
    run: (api, principal, args) => api.renameForm(principal, args.formId, { name: args.name })
  },
  {
    name: 'duplicate_form',
    description: 'Duplicate a form into the same project. The copy is unpublished.',
    input: { formId, name },
    additive: true,
    run: (api, principal, args) => api.duplicateForm(principal, args.formId, { name: args.name })
  },
  {
    name: 'move_form',
    description: 'Move a form to another project in the same workspace.',
    input: { formId, targetProjectId: projectId },
    run: (api, principal, args) =>
      api.moveForm(principal, args.formId, { targetProjectId: args.targetProjectId })
  },
  {
    name: 'update_form_drafts',
    description:
      'Replace the draft fields of a form. Pass the current version from get_form; the draft is saved with version + 1.',
    input: {
      formId,
      version: z.number().int().describe('Current form version'),
      drafts: z
        .array(z.record(z.string(), z.any()))
        .describe('Draft fields, same shape as get_form drafts'),
      logics: z.array(z.record(z.string(), z.any())).optional().describe('Draft logics')
    },
    run: (api, principal, { formId, ...body }) => api.updateDrafts(principal, formId, body)
  },
  {
    name: 'publish_form',
    description:
      'Publish fields and make the form accept submissions. Pass the current version from get_form.',
    input: {
      formId,
      version: z.number().int().describe('Current form version'),
      drafts: z
        .array(z.record(z.string(), z.any()))
        .describe('Fields to publish, same shape as get_form drafts'),
      logics: z.array(z.record(z.string(), z.any())).optional().describe('Logics to publish')
    },
    run: (api, principal, { formId, ...body }) => api.publishForm(principal, formId, body)
  },
  {
    name: 'unpublish_form',
    description: 'Stop a form from accepting submissions.',
    input: { formId },
    run: (api, principal, args) => api.unpublishForm(principal, args.formId)
  },
  {
    name: 'set_form_availability',
    description: 'Open or close a published form for submissions.',
    input: { formId, active: z.boolean() },
    run: (api, principal, args) =>
      api.setFormAvailability(principal, args.formId, { active: args.active })
  },
  {
    name: 'update_form_settings',
    description:
      'Update form settings, e.g. locale, enableProgress, closedAt, quotaLimit, redirectUrl, requirePassword, password.',
    input: { formId, settings: z.record(z.string(), z.any()).describe('Settings to change') },
    run: (api, principal, args) => api.updateSettings(principal, args.formId, args.settings)
  },
  {
    name: 'update_form_theme',
    description:
      'Update form theme: fontFamily, questionTextColor, answerTextColor, buttonBackground, buttonTextColor, backgroundColor, backgroundImage, backgroundBrightness, customCSS.',
    input: {
      formId,
      theme: z.record(z.string(), z.any()).describe('Theme properties'),
      logo: z.string().nullable().optional().describe('Logo image URL'),
      favicon: z.string().nullable().optional().describe('Favicon image URL')
    },
    run: (api, principal, { formId, ...body }) => api.updateTheme(principal, formId, body)
  },
  {
    name: 'update_form_hidden_fields',
    description: 'Replace the hidden fields of a form.',
    input: {
      formId,
      hiddenFields: z.array(z.object({ id: z.string(), name: z.string() }))
    },
    run: (api, principal, args) =>
      api.updateHiddenFields(principal, args.formId, { hiddenFields: args.hiddenFields })
  },
  {
    name: 'update_form_variables',
    description: 'Replace the variables of a form.',
    input: {
      formId,
      variables: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          kind: z.enum(['string', 'number']),
          value: z.union([z.string(), z.number()])
        })
      )
    },
    run: (api, principal, args) =>
      api.updateVariables(principal, args.formId, { variables: args.variables })
  },
  {
    name: 'trash_form',
    description: 'Move a form to trash. It can be restored within 30 days.',
    input: { formId },
    run: (api, principal, args) => api.trashForm(principal, args.formId)
  },
  {
    name: 'restore_form',
    description: 'Restore a form from trash.',
    input: { formId },
    additive: true,
    run: (api, principal, args) => api.restoreForm(principal, args.formId)
  },
  {
    name: 'list_submissions',
    description: 'List submissions of a form.',
    input: {
      formId,
      page: z.number().int().min(1).optional(),
      limit: z.number().int().min(1).max(100).optional()
    },
    readOnly: true,
    run: (api, principal, args) =>
      api.listSubmissions(principal, args.formId, args.page, args.limit)
  },
  {
    name: 'get_submission',
    description: 'Get a submission.',
    input: { formId, submissionId },
    readOnly: true,
    run: (api, principal, args) => api.getSubmission(principal, args.formId, args.submissionId)
  },
  {
    name: 'update_submission_category',
    description: 'Move a submission to inbox, starred, archive or spam.',
    input: { formId, submissionId, category: z.enum(SubmissionCategoryEnum) },
    run: (api, principal, args) =>
      api.updateSubmissionCategory(principal, args.formId, args.submissionId, {
        category: args.category
      })
  },
  {
    name: 'update_submission_answer',
    description: 'Edit one answer of a submission.',
    input: { formId, submissionId, fieldId: z.string(), value: z.any() },
    run: (api, principal, args) =>
      api.editSubmissionAnswer(principal, args.formId, args.submissionId, {
        fieldId: args.fieldId,
        value: args.value
      })
  }
]

@Controller('mcp')
@UseGuards(RestApiKeyGuard)
export class McpController {
  private readonly logger = new Logger(McpController.name)

  constructor(private readonly api: RestApiService) {}

  @Post()
  async handle(@Req() req: ApiRequest, @Res() res: Response) {
    const server = this.createServer(req)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    })
    res.on('close', () => {
      transport.close()
      server.close()
    })
    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)
  }

  // Stateless server: no SSE stream or session to open or close.
  @Get()
  openStream() {
    throw new MethodNotAllowedException()
  }

  @Delete()
  closeSession() {
    throw new MethodNotAllowedException()
  }

  private createServer(req: ApiRequest) {
    const server = new McpServer({ name: 'heyform', version: 'v1' })

    for (const tool of TOOLS) {
      server.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: tool.input ?? {},
          annotations: {
            readOnlyHint: !!tool.readOnly,
            destructiveHint: !tool.readOnly && !tool.additive
          }
        },
        async (args: any) => {
          try {
            const result = await tool.run(this.api, req.apiPrincipal, args)
            return { content: [{ type: 'text', text: JSON.stringify(result) }] }
          } catch (error) {
            this.logger.error(error, error?.stack)
            const text = JSON.stringify(toClientException(error).getResponse())
            return { isError: true, content: [{ type: 'text', text }] }
          }
        }
      )
    }
    return server
  }
}
