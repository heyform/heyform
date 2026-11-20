import {
  CaptchaKindEnum,
  FieldKindEnum,
  FormStatusEnum,
  SubmissionCategoryEnum,
  SubmissionStatusEnum
} from '@heyform-inc/shared-types-enums'
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  DynamicModule,
  ForbiddenException,
  Get,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Type,
  UseGuards
} from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { isEmail } from 'class-validator'

import {
  FormService,
  ProjectService,
  SubmissionService,
  TeamMemberService,
  TeamService,
  UserService
} from '../service'
import { AccountApiKeysController, AccountApiKeysGuard } from './account-api-keys.controller'
import { ApiKey, ApiKeySchema, ApiKeyScope, ApiKeyService } from './api-key.service'
import { ApiRequest, RestApiKeyGuard } from './rest-api-key.guard'
import { BCRYPT_SALT } from '@environments'
import { AuthGuard } from '@guard'
import {
  ValidateError,
  fieldsToValidateRules,
  flattenFields,
  validate
} from '@heyform-inc/answer-utils'
import { helper, nanoid, timestamp } from '@heyform-inc/utils'
import {
  assertValidChoiceBranching,
  assertValidFormNavigation,
  isSafeCSSValue,
  isSafeCustomCSS,
  passwordHash,
  sanitizeFormDrafts
} from '@utils'
import { assertSafeSpecialFieldAnswers } from '@utils'

function requireScope(
  req: ApiRequest,
  scope: ApiKeyScope,
  workspaceId?: string,
  projectId?: string
) {
  const principal = req.apiPrincipal
  if (!principal) throw new ForbiddenException()

  const workspace = principal.workspaces.get(workspaceId)
  if (
    !principal.scopes.includes(scope) ||
    (workspaceId && !workspace?.scopes.includes(scope)) ||
    (projectId && !workspace?.projectIds.has(projectId))
  ) {
    throw new ForbiddenException()
  }
}
function identifier(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(value))
    throw new BadRequestException('Invalid identifier')
  return value
}
function validName(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 100)
    throw new BadRequestException('Invalid name')
  return value.trim()
}
@Controller('api/v1')
@UseGuards(RestApiKeyGuard)
export class RestApiController {
  constructor(
    private readonly teams: TeamService,
    private readonly teamMembers: TeamMemberService,
    private readonly users: UserService,
    private readonly projects: ProjectService,
    private readonly forms: FormService,
    private readonly submissions: SubmissionService
  ) {}
  @Get('health')
  health() {
    return { status: 'ok', version: 'v1' }
  }

  @Get('workspaces')
  async workspaces(@Req() req: ApiRequest) {
    requireScope(req, 'workspaces:read')
    const rows = await this.teams.findAllBy({
      _id: { $in: [...req.apiPrincipal.workspaces.keys()] }
    })
    return rows.filter(Boolean).map(t => ({ id: t.id, name: t.name, ownerId: t.ownerId }))
  }
  @Get('workspaces/:id/projects')
  async listProjects(@Req() req: ApiRequest, @Param('id') id: string) {
    requireScope(req, 'projects:read', id)
    if (!(await this.teams.findById(identifier(id)))) throw new NotFoundException()
    const projects = await this.projects.findByIds(
      [...req.apiPrincipal.workspaces.get(id).projectIds],
      { teamId: id }
    )
    return projects.map(p => ({
      id: p.id,
      name: p.name,
      workspaceId: p.teamId,
      ownerId: p.ownerId
    }))
  }
  private async canReadUser(req: ApiRequest, userId: string) {
    const memberships = await this.teams.findMemberRelationInTeams(userId, [
      ...req.apiPrincipal.workspaces.keys()
    ])
    return memberships.length > 0
  }
  @Get('users/me')
  async getCurrentUser(@Req() req: ApiRequest) {
    const user = await this.users.findById(req.apiPrincipal.userId)
    if (!user) throw new NotFoundException()
    return { id: user.id, name: user.name, email: user.email }
  }
  @Get('workspaces/:id')
  async getWorkspace(@Req() req: ApiRequest, @Param('id') id: string) {
    requireScope(req, 'workspaces:read', id)
    const team = await this.teams.findById(identifier(id))
    if (!team) throw new NotFoundException()
    return { id: team.id, name: team.name, ownerId: team.ownerId }
  }
  @Patch('workspaces/:id')
  async updateWorkspace(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    requireScope(req, 'workspaces:write', id)
    const team = await this.teams.findById(identifier(id))
    if (!team) throw new NotFoundException()
    const name = validName(body?.name)
    await this.teams.update(id, { name })
    return { id, name, ownerId: team.ownerId }
  }
  @Get('users/:id')
  async getUser(@Req() req: ApiRequest, @Param('id') id: string) {
    requireScope(req, 'users:read')
    const user = await this.users.findById(identifier(id))
    if (!user || !(await this.canReadUser(req, id))) throw new NotFoundException()
    return { id: user.id, name: user.name, email: user.email }
  }
  @Post('workspaces/:id/projects')
  async createProject(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    requireScope(req, 'projects:write', id)
    const team = await this.teams.findById(identifier(id))
    if (!team) throw new NotFoundException()
    const name = validName(body?.name)
    const ownerId = req.apiPrincipal.userId
    const projectId = await this.projects.create({ teamId: id, name, ownerId })
    try {
      const members = [...new Set([team.ownerId, ownerId])].map(memberId => ({
        projectId,
        memberId
      }))
      await this.projects.addMembers(members)
    } catch (error) {
      await this.projects.deleteAllMemberInProject(projectId)
      await this.projects.delete(projectId)
      throw error
    }
    return { id: projectId, name, workspaceId: id, ownerId }
  }
  @Get('workspaces/:id/members')
  async listMembers(@Req() req: ApiRequest, @Param('id') id: string) {
    requireScope(req, 'members:read', id)
    if (!(await this.teams.findById(identifier(id)))) throw new NotFoundException()
    return (await this.teams.findMembersInTeam(id)).map(m => ({ userId: m.memberId, role: m.role }))
  }
  @Post('workspaces/:id/invitations')
  async inviteMembers(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    requireScope(req, 'members:write', id)
    const emails = body?.emails
    if (
      !Array.isArray(emails) ||
      emails.length < 1 ||
      emails.length > 20 ||
      !emails.every(email => typeof email === 'string' && isEmail(email.trim()))
    )
      throw new BadRequestException('Invalid emails')
    const team = await this.teams.findById(identifier(id))
    const user = await this.users.findById(req.apiPrincipal.userId)
    if (!team || !user) throw new NotFoundException()
    return { workspaceId: id, emails: await this.teamMembers.invite(team, user, emails) }
  }
  @Delete('workspaces/:id/members/:userId')
  async removeMember(
    @Req() req: ApiRequest,
    @Param('id') id: string,
    @Param('userId') userId: string
  ) {
    requireScope(req, 'members:write', id)
    const team = await this.teams.findById(identifier(id))
    const member = await this.teams.findMemberById(id, identifier(userId))
    if (!team || !member) throw new NotFoundException()
    if (userId === team.ownerId) throw new ForbiddenException('Cannot remove the workspace owner')
    await this.teamMembers.remove(id, userId)
    return { removed: true, workspaceId: id, userId }
  }
  @Patch('projects/:id')
  async renameProject(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    const project = await this.projects.findById(identifier(id))
    if (!project) throw new NotFoundException()
    requireScope(req, 'projects:write', project.teamId, project.id)
    const name = validName(body?.name)
    await this.projects.update(id, { name })
    return { id, name }
  }
  @Get('projects/:id/forms')
  async listForms(@Req() req: ApiRequest, @Param('id') id: string) {
    const project = await this.projects.findById(identifier(id))
    if (!project) throw new NotFoundException()
    requireScope(req, 'forms:read', project.teamId, project.id)
    return (await this.forms.findAll(id, FormStatusEnum.NORMAL)).map(f => ({
      id: f.id,
      name: f.name,
      version: f.version,
      publishedAt: f.publishedAt
    }))
  }
  @Post('projects/:id/forms')
  async createForm(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    const project = await this.projects.findById(identifier(id))
    if (!project) throw new NotFoundException()
    requireScope(req, 'forms:write', project.teamId, project.id)
    const name = validName(body?.name)
    const drafts = [
      {
        id: nanoid(12),
        title: null,
        description: null,
        kind: FieldKindEnum.SHORT_TEXT,
        validations: { required: false }
      },
      { id: nanoid(12), title: ['Thank you!'], kind: FieldKindEnum.THANK_YOU }
    ]
    const memberId = req.apiPrincipal.userId
    const formId = await this.forms.create({
      name,
      teamId: project.teamId,
      projectId: id,
      memberId,
      fields: [],
      _drafts: JSON.stringify(drafts),
      fieldsUpdatedAt: 0,
      hiddenFields: [],
      version: 0,
      status: FormStatusEnum.NORMAL,
      settings: {
        active: false,
        captchaKind: CaptchaKindEnum.NONE,
        filterSpam: false,
        allowArchive: true,
        requirePassword: false,
        locale: 'en',
        enableQuestionList: true,
        enableNavigationArrows: true,
        enableEmailNotification: true
      }
    })
    return { id: formId, name, projectId: id, workspaceId: project.teamId }
  }
  @Patch('forms/:id')
  async renameForm(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'forms:write', form.teamId, form.projectId)
    const name = validName(body?.name)
    await this.forms.update(id, { name })
    return { id, name }
  }
  @Post('forms/:id/duplicate')
  async duplicateForm(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'forms:write', form.teamId, form.projectId)
    if (form.status !== FormStatusEnum.NORMAL) throw new ConflictException('Invalid form status')
    const name = validName(body?.name)
    const project = await this.projects.findById(form.projectId)
    if (!project || project.teamId !== form.teamId)
      throw new ConflictException('Invalid source project')
    const copy: any = {}
    for (const field of [
      'variables',
      'logics',
      'draftLogics',
      'translations',
      'hiddenFields',
      '_drafts',
      'kind',
      'interactiveMode',
      'themeSettings'
    ]) {
      const value = form.get(field)
      if (value !== undefined) copy[field] = value
    }
    const settings = form.settings ? JSON.parse(JSON.stringify(form.settings)) : {}
    delete settings.password
    const memberId = req.apiPrincipal.userId
    const formId = await this.forms.create({
      ...copy,
      name,
      teamId: form.teamId,
      projectId: project.id,
      memberId,
      fields: [],
      _drafts: copy._drafts || JSON.stringify(form.fields || []),
      fieldsUpdatedAt: 0,
      version: 0,
      status: FormStatusEnum.NORMAL,
      settings: { ...settings, active: false, requirePassword: false }
    })
    return { id: formId, name, projectId: project.id, workspaceId: form.teamId, active: false }
  }
  @Post('forms/:id/move')
  async moveForm(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'forms:write', form.teamId, form.projectId)
    if (form.status !== FormStatusEnum.NORMAL) throw new ConflictException('Invalid form status')
    const project = await this.projects.findById(identifier(body?.targetProjectId))
    if (!project) throw new NotFoundException()
    if (project.teamId !== form.teamId)
      throw new ForbiddenException('Cross-workspace movement is not permitted')
    requireScope(req, 'forms:write', project.teamId, project.id)
    await this.forms.update(id, { projectId: project.id })
    return { id, projectId: project.id, workspaceId: form.teamId }
  }
  private async editableForm(req: ApiRequest, id: string) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'forms:write', form.teamId, form.projectId)
    if (form.status !== FormStatusEnum.NORMAL) throw new ConflictException('Invalid form status')
    return form
  }
  @Patch('forms/:id/hidden-fields')
  async updateHiddenFields(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    await this.editableForm(req, id)
    if (!Array.isArray(body?.hiddenFields) || body.hiddenFields.length > 200)
      throw new BadRequestException('Invalid hidden fields')
    const hiddenFields = body.hiddenFields.map((f: any) => ({
      id: identifier(f?.id),
      name: validName(f?.name)
    }))
    if (
      new Set(hiddenFields.map(f => f.id)).size !== hiddenFields.length ||
      new Set(hiddenFields.map(f => f.name)).size !== hiddenFields.length
    )
      throw new BadRequestException('Duplicate hidden fields')
    await this.forms.update(id, { hiddenFields })
    return { id, hiddenFields }
  }
  @Patch('forms/:id/variables')
  async updateVariables(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    await this.editableForm(req, id)
    if (!Array.isArray(body?.variables) || body.variables.length > 200)
      throw new BadRequestException('Invalid variables')
    const variables = body.variables.map((v: any) => {
      if (
        !v ||
        !['string', 'number'].includes(v.kind) ||
        typeof v.value !== v.kind ||
        (v.kind === 'number' && !Number.isFinite(v.value))
      )
        throw new BadRequestException('Invalid variable')
      return { id: identifier(v.id), name: validName(v.name), kind: v.kind, value: v.value }
    })
    if (new Set(variables.map(v => v.id)).size !== variables.length)
      throw new BadRequestException('Duplicate variables')
    await this.forms.update(id, { variables })
    return { id, variables }
  }
  @Patch('forms/:id/settings')
  async updateSettings(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    const form = await this.editableForm(req, id)
    const booleans = [
      'enableExpirationDate',
      'enableTimeLimit',
      'filterSpam',
      'generatePseudonymId',
      'enableQuotaLimit',
      'enableIpLimit',
      'displayIpAddress',
      'enableProgress',
      'enableQuestionList',
      'enableNavigationArrows',
      'openLinksInNewTab',
      'enableClosedMessage',
      'allowArchive',
      'requirePassword',
      'enableEmailNotification',
      'redirectOnCompletion'
    ]
    const numbers = [
      'enabledAt',
      'closedAt',
      'timeLimit',
      'quotaLimit',
      'ipLimitCount',
      'ipLimitTime',
      'redirectDelay'
    ]
    const strings = [
      'expirationTimeZone',
      'locale',
      'closedFormTitle',
      'closedFormDescription',
      'metaTitle',
      'metaDescription',
      'redirectUrl',
      'metaOGImageUrl'
    ]
    if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.keys(body).length)
      throw new BadRequestException('Settings required')
    const updates: Record<string, any> = {}
    for (const [key, value] of Object.entries(body)) {
      if (booleans.includes(key) && typeof value === 'boolean') updates['settings.' + key] = value
      else if (
        numbers.includes(key) &&
        typeof value === 'number' &&
        Number.isSafeInteger(value) &&
        value >= (['quotaLimit', 'ipLimitCount'].includes(key) ? 1 : 0)
      )
        updates['settings.' + key] = value
      else if (strings.includes(key) && typeof value === 'string') {
        if (['redirectUrl', 'metaOGImageUrl'].includes(key)) {
          try {
            if (!['http:', 'https:'].includes(new URL(value).protocol)) throw new Error()
          } catch {
            throw new BadRequestException('Invalid URL')
          }
        }
        updates['settings.' + key] = value
      } else if (
        key === 'password' &&
        typeof value === 'string' &&
        value.length >= 1 &&
        value.length <= 72
      )
        updates['settings.password'] = await passwordHash(value, BCRYPT_SALT)
      else throw new BadRequestException('Invalid or unsupported setting: ' + key)
    }
    if (body.requirePassword === true && !updates['settings.password'] && !form.settings?.password)
      throw new BadRequestException('Password required')
    await this.forms.update(id, updates)
    return { id, updated: true }
  }
  @Patch('forms/:id/theme')
  async updateTheme(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    await this.editableForm(req, id)
    const theme = body?.theme
    if (!theme || typeof theme !== 'object' || Array.isArray(theme))
      throw new BadRequestException('Theme required')
    const allowed = [
      'fontFamily',
      'questionTextColor',
      'answerTextColor',
      'buttonBackground',
      'buttonTextColor',
      'backgroundColor',
      'backgroundImage',
      'backgroundBrightness',
      'customCSS'
    ]
    for (const [key, value] of Object.entries(theme)) {
      if (
        !allowed.includes(key) ||
        (key === 'backgroundBrightness'
          ? typeof value !== 'number' || !Number.isFinite(value) || value < -100 || value > 100
          : typeof value !== 'string' ||
            !(key === 'customCSS' ? isSafeCustomCSS(value) : isSafeCSSValue(value)))
      )
        throw new BadRequestException('Invalid theme property: ' + key)
    }
    const updates: Record<string, any> = { 'themeSettings.theme': theme }
    for (const key of ['logo', 'favicon']) {
      if (body[key] === undefined) continue
      if (body[key] !== null) {
        try {
          if (
            typeof body[key] !== 'string' ||
            !['http:', 'https:'].includes(new URL(body[key]).protocol)
          )
            throw new Error()
        } catch {
          throw new BadRequestException('Invalid image URL')
        }
      }
      updates['themeSettings.' + key] = body[key]
    }
    await this.forms.update(id, updates)
    return { id, updated: true }
  }
  @Post('forms/:id/trash')
  async trashForm(@Req() req: ApiRequest, @Param('id') id: string) {
    await this.editableForm(req, id)
    await this.forms.update(id, {
      retentionAt: timestamp() + 30 * 86400,
      'settings.active': false,
      status: FormStatusEnum.TRASH
    })
    return { id, trashed: true }
  }
  @Post('forms/:id/restore')
  async restoreForm(@Req() req: ApiRequest, @Param('id') id: string) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'forms:write', form.teamId, form.projectId)
    if (form.status !== FormStatusEnum.TRASH) throw new ConflictException('Form is not in trash')
    await this.forms.update(id, {
      retentionAt: -1,
      status: FormStatusEnum.NORMAL,
      'settings.active': false
    })
    return { id, restored: true }
  }
  @Patch('forms/:id/drafts')
  async updateDrafts(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'forms:write', form.teamId, form.projectId)
    if (
      form.status !== FormStatusEnum.NORMAL ||
      !Number.isSafeInteger(body?.version) ||
      body.version !== form.version
    )
      throw new ConflictException('Invalid draft version or form status')
    if (!Array.isArray(body.drafts) || (body.logics != null && !Array.isArray(body.logics)))
      throw new BadRequestException('Invalid drafts or logics')
    const drafts = sanitizeFormDrafts(body.drafts)
    assertValidFormNavigation(drafts)
    const logics = body.logics ?? form.draftLogics ?? form.logics ?? []
    assertValidChoiceBranching(drafts, logics)
    await this.forms.update(id, {
      _drafts: JSON.stringify(drafts),
      draftLogics: logics,
      fieldsUpdatedAt: timestamp(),
      version: body.version + 1
    })
    return { id, drafts, version: body.version + 1 }
  }
  @Post('forms/:id/publish')
  async publishForm(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'forms:write', form.teamId, form.projectId)
    if (
      form.status !== FormStatusEnum.NORMAL ||
      !Number.isSafeInteger(body?.version) ||
      body.version !== form.version
    )
      throw new ConflictException('Invalid draft version or form status')
    if (!Array.isArray(body.drafts) || (body.logics != null && !Array.isArray(body.logics)))
      throw new BadRequestException('Invalid drafts or logics')
    const drafts = sanitizeFormDrafts(body.drafts)
    assertValidFormNavigation(drafts)
    const logics = body.logics ?? form.draftLogics ?? form.logics ?? []
    assertValidChoiceBranching(drafts, logics)
    const now = timestamp()
    const updates: Record<string, any> = {
      fields: drafts,
      logics,
      draftLogics: logics,
      _drafts: JSON.stringify(drafts),
      fieldsUpdatedAt: now,
      version: body.version,
      'settings.active': true
    }
    if (!form.publishedAt) updates.publishedAt = now
    const user = await this.users.findById(req.apiPrincipal.userId)
    if (!user) throw new NotFoundException()
    if (helper.isValidArray(form.settings?.languages)) {
      await this.forms.addTranslateQueue(id, form.teamId, user.id, form.settings!.languages)
    }
    if (!user.hasPublishedForm) await this.users.update(user.id, { publishedFormAt: now })
    await this.forms.update(id, updates)
    return {
      id,
      active: true,
      version: body.version,
      publishedAt: updates.publishedAt ?? form.publishedAt
    }
  }
  @Post('forms/:id/unpublish')
  async unpublishForm(@Req() req: ApiRequest, @Param('id') id: string) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'forms:write', form.teamId, form.projectId)
    await this.forms.update(id, { 'settings.active': false })
    return { id, active: false }
  }
  @Patch('forms/:id/availability')
  async setFormAvailability(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'forms:write', form.teamId, form.projectId)
    if (form.status !== FormStatusEnum.NORMAL) throw new ConflictException('Invalid form status')
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      typeof body.active !== 'boolean'
    ) {
      throw new BadRequestException('active must be a boolean')
    }
    if (body.active && !form.publishedAt) throw new ConflictException('Form has not been published')
    await this.forms.update(id, { 'settings.active': body.active })
    return { id, active: body.active }
  }
  private async submissionForm(req: ApiRequest, id: string, scope: ApiKeyScope) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, scope, form.teamId, form.projectId)
    return form
  }
  @Get('forms/:id/submissions/:submissionId')
  async getSubmission(
    @Req() req: ApiRequest,
    @Param('id') id: string,
    @Param('submissionId') submissionId: string
  ) {
    await this.submissionForm(req, id, 'submissions:read')
    if (!/^[a-fA-F0-9]{24}$/.test(submissionId))
      throw new BadRequestException('Invalid submission ID')
    const row = await this.submissions.findByFormId(id, submissionId)
    if (!row || row.status !== SubmissionStatusEnum.PUBLIC) throw new NotFoundException()
    return {
      id: row.id,
      formId: row.formId,
      category: row.category,
      title: row.title,
      answers: row.answers,
      hiddenFields: row.hiddenFields,
      variables: row.variables,
      startAt: row.startAt,
      endAt: row.endAt,
      pseudonymId: row.pseudonymId
    }
  }
  @Patch('forms/:id/submissions/:submissionId/category')
  async updateSubmissionCategory(
    @Req() req: ApiRequest,
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @Body() body: any
  ) {
    await this.submissionForm(req, id, 'submissions:write')
    const category = body?.category
    if (
      !/^[a-fA-F0-9]{24}$/.test(submissionId) ||
      typeof category !== 'string' ||
      !Object.values(SubmissionCategoryEnum).includes(category as SubmissionCategoryEnum)
    )
      throw new BadRequestException('Invalid submission ID or category')
    const row = await this.submissions.findByFormId(id, submissionId)
    if (!row || row.status !== SubmissionStatusEnum.PUBLIC) throw new NotFoundException()
    if (
      !(await this.submissions.updateCategory({
        formId: id,
        submissionIds: [submissionId],
        category: category as SubmissionCategoryEnum
      }))
    )
      throw new NotFoundException()
    return { id: submissionId, category }
  }
  @Patch('forms/:id/submissions/:submissionId/answer')
  async editSubmissionAnswer(
    @Req() req: ApiRequest,
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @Body() body: any
  ) {
    const form = await this.submissionForm(req, id, 'submissions:write')
    if (!/^[a-fA-F0-9]{24}$/.test(submissionId))
      throw new BadRequestException('Invalid submission ID')
    const row = await this.submissions.findByFormId(id, submissionId)
    if (!row || row.status !== SubmissionStatusEnum.PUBLIC) throw new NotFoundException()
    const rule = fieldsToValidateRules(flattenFields(form.fields, true)).find(
      r => r.id === body?.fieldId
    )
    if (!rule || !Object.prototype.hasOwnProperty.call(body, 'value'))
      throw new BadRequestException('Invalid field or missing value')
    try {
      assertSafeSpecialFieldAnswers([rule], { [rule.id]: body.value })
      validate(rule, body.value)
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      if (error instanceof ValidateError) throw new BadRequestException(error.response)
      throw error
    }
    const answer = {
      id: rule.id,
      kind: rule.kind,
      properties: rule.properties || {},
      title: rule.title,
      value: body.value
    }
    const updated = row.answers.some(a => a.id === rule.id)
      ? await this.submissions.updateAnswer(submissionId, answer)
      : await this.submissions.createAnswer(submissionId, answer)
    if (!updated) throw new ConflictException('Answer update failed')
    return { id: submissionId, updated: true }
  }
  @Get('forms/:id/submissions')
  async listSubmissions(
    @Req() req: ApiRequest,
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '30'
  ) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'submissions:read', form.teamId, form.projectId)
    const p = Number(page),
      l = Number(limit)
    if (
      !Number.isSafeInteger(p) ||
      p < 1 ||
      p > 1000000 ||
      !Number.isSafeInteger(l) ||
      l < 1 ||
      l > 100
    )
      throw new BadRequestException('Invalid pagination')
    const total = await this.submissions.count({ formId: id })
    const submissions = await this.submissions.findAll({
      formId: id,
      page: p,
      limit: l,
      withIp: false
    })
    return {
      total,
      page: p,
      limit: l,
      submissions: submissions.map(submission => ({ ...submission.toJSON(), id: submission.id }))
    }
  }
  @Get('forms/:id')
  async getForm(@Req() req: ApiRequest, @Param('id') id: string) {
    requireScope(req, 'forms:read')
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'forms:read', form.teamId, form.projectId)
    return {
      id: form.id,
      name: form.name,
      workspaceId: form.teamId,
      projectId: form.projectId,
      fields: form.fields,
      drafts: form.get('drafts'),
      hiddenFields: form.hiddenFields,
      variables: form.variables,
      logics: form.logics,
      draftLogics: form.draftLogics,
      themeSettings: form.themeSettings,
      status: form.status,
      active: form.settings?.active,
      version: form.version,
      publishedAt: form.publishedAt
    }
  }
}
@Module({})
export class RestApiModule {
  static register(serviceModule: Type<any>): DynamicModule {
    return {
      module: RestApiModule,
      imports: [
        serviceModule,
        MongooseModule.forFeature([{ name: ApiKey.name, schema: ApiKeySchema }])
      ],
      controllers: [RestApiController, AccountApiKeysController],
      providers: [ApiKeyService, RestApiKeyGuard, AccountApiKeysGuard, AuthGuard]
    }
  }
}
