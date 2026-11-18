import { z } from 'zod'

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

import { HeyFormClient } from './client'

const TEAMS_GQL = `
  query teams {
    teams {
      id
      name
      projects {
        id
        name
        teamId
      }
    }
  }
`

const FORMS_GQL = `
  query forms($input: FormsInput!) {
    forms(input: $input) {
      id
      name
      teamId
      projectId
      status
      submissionCount
      updatedAt
      settings {
        active
      }
    }
  }
`

const FORM_DETAIL_GQL = `
  query formDetail($input: FormDetailInput!) {
    formDetail(input: $input) {
      id
      name
      teamId
      projectId
      kind
      interactiveMode
      isDraft
      version
      submissionCount
      updatedAt
      settings {
        active
      }
      drafts {
        id
        kind
        title
        description
        validations
        properties
      }
      hiddenFields {
        id
        name
      }
    }
  }
`

const SUBMISSIONS_GQL = `
  query submissions($input: SubmissionsInput!) {
    submissions(input: $input) {
      total
      submissions {
        id
        category
        title
        answers
        hiddenFields {
          id
          name
          value
        }
        endAt
      }
    }
  }
`

const CREATE_FORM_GQL = `
  mutation createForm($input: CreateFormInput!) {
    createForm(input: $input)
  }
`

// FormStatusEnum, FormKindEnum and InteractiveModeEnum in @heyform-inc/shared-types-enums
const STATUS = { active: 1, trash: 2 } as const
const KIND = { survey: 1, quiz: 2, contact: 3 } as const
const INTERACTIVE_MODE_GENERAL = 1

function json(value: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] }
}

function fail(err: unknown): CallToolResult {
  return {
    isError: true,
    content: [{ type: 'text', text: err instanceof Error ? err.message : String(err) }]
  }
}

async function run(fn: () => Promise<unknown>): Promise<CallToolResult> {
  try {
    return json(await fn())
  } catch (err) {
    return fail(err)
  }
}

export function registerTools(server: McpServer, client: HeyFormClient) {
  server.registerTool(
    'list_workspaces',
    {
      title: 'List workspaces and projects',
      description:
        'List the workspaces (teams) the signed-in user belongs to, with their projects. ' +
        'Use the project ids with list_forms and create_form.',
      annotations: { readOnlyHint: true }
    },
    () => run(async () => (await client.query<{ teams: unknown }>('teams', TEAMS_GQL)).teams)
  )

  server.registerTool(
    'list_forms',
    {
      title: 'List forms',
      description: 'List the forms in a project, with submission counts.',
      inputSchema: {
        projectId: z.string().describe('Project id from list_workspaces'),
        status: z
          .enum(['active', 'trash'])
          .default('active')
          .describe('Return active forms or forms in the trash'),
        keyword: z.string().max(100).optional().describe('Only forms whose name matches')
      },
      annotations: { readOnlyHint: true }
    },
    ({ projectId, status, keyword }) =>
      run(
        async () =>
          (
            await client.query<{ forms: unknown }>('forms', FORMS_GQL, {
              input: { projectId, status: STATUS[status], keyword }
            })
          ).forms
      )
  )

  server.registerTool(
    'get_form',
    {
      title: 'Get a form',
      description:
        'Get a form with its draft fields (id, kind, title, validations, properties) and hidden fields. ' +
        'Submission answers refer to fields by these field ids.',
      inputSchema: { formId: z.string().describe('Form id from list_forms') },
      annotations: { readOnlyHint: true }
    },
    ({ formId }) =>
      run(
        async () =>
          (
            await client.query<{ formDetail: unknown }>('formDetail', FORM_DETAIL_GQL, {
              input: { formId }
            })
          ).formDetail
      )
  )

  server.registerTool(
    'list_submissions',
    {
      title: 'List form submissions',
      description: 'List the submissions of a form, newest first, one page at a time.',
      inputSchema: {
        formId: z.string().describe('Form id from list_forms'),
        page: z.number().int().min(1).default(1),
        limit: z
          .number()
          .int()
          .min(10)
          .max(30)
          .default(30)
          .describe('Submissions per page (10 to 30, the server limit)')
      },
      annotations: { readOnlyHint: true }
    },
    ({ formId, page, limit }) =>
      run(async () => {
        const { submissions } = await client.query<{ submissions: { total: number } }>(
          'submissions',
          SUBMISSIONS_GQL,
          {
            input: { formId, page, limit }
          }
        )

        return {
          page,
          limit,
          hasMore: page * limit < submissions.total,
          ...submissions
        }
      })
  )

  server.registerTool(
    'create_form',
    {
      title: 'Create a form',
      description:
        'Create an empty draft form in a project and return its id. ' +
        'The form is not published; open it in the HeyForm dashboard to add fields and publish.',
      inputSchema: {
        projectId: z.string().describe('Project id from list_workspaces'),
        name: z.string().min(1).max(100).describe('Form name'),
        kind: z.enum(['survey', 'quiz', 'contact']).default('survey')
      },
      annotations: { readOnlyHint: false, destructiveHint: false }
    },
    ({ projectId, name, kind }) =>
      run(async () => {
        const data = await client.query<{ createForm: string }>('createForm', CREATE_FORM_GQL, {
          input: {
            projectId,
            name,
            kind: KIND[kind],
            interactiveMode: INTERACTIVE_MODE_GENERAL
          }
        })

        return { formId: data.createForm }
      })
  )
}
