import { WorkspaceApiUiController } from './workspace-api-ui.controller'
import { WorkspaceApiUiGuard } from './workspace-api-ui.guard'
import { AuthGuard } from '../common/guard/auth.guard'
import { RestApiKeyGuard } from './rest-api-key.guard'
import { RestApiDocsController } from './rest-api-docs.controller'
import { BadRequestException, Body, CanActivate, Controller, ConflictException, Patch, Delete, ExecutionContext, ForbiddenException, Get, Injectable, Module, NotFoundException, Param, Post, Query, Req, UnauthorizedException, UseGuards, DynamicModule, Type } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'
import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { Request } from 'express'
import { TeamService, UserService, ProjectService, FormService, SubmissionService, IntegrationService, AppService } from '../service'
import { FormStatusEnum, CaptchaKindEnum, FieldKindEnum, SubmissionStatusEnum, SubmissionCategoryEnum } from '@heyform-inc/shared-types-enums'
import { nanoid, timestamp, helper } from '@heyform-inc/utils'
import { assertValidChoiceBranching, assertValidFormNavigation, sanitizeFormDrafts, gravatar, isSafeCSSValue, isSafeCustomCSS, passwordHash } from '@utils'
import { integrationSecrets } from '../service/integration-secrets'
import { ValidateError, fieldsToValidateRules, flattenFields, validate } from '@heyform-inc/answer-utils'
import { assertSafeSpecialFieldAnswers } from '@utils'
import { IntegrationStatusEnum } from '@model'
import { assertSafeOutboundUrl, mapToObject } from '@utils'
import { BCRYPT_SALT } from '@environments'
import { TeamRoleEnum } from '../model/team-member.model'

const scopes = ['workspaces:read', 'users:read', 'projects:read', 'forms:read', 'members:write', 'members:read', 'workspaces:write', 'projects:write', 'forms:write', 'submissions:read', 'submissions:write', 'webhooks:read', 'webhooks:write']
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
type Principal = { admin: boolean; workspaceId?: string; scopes: string[] }
type ApiRequest = Request & { apiPrincipal?: Principal }
function requireScope(req: ApiRequest, scope: string, workspaceId?: string) {
  const p = req.apiPrincipal
  if (!p || (!p.admin && (!p.scopes.includes(scope) || (workspaceId && p.workspaceId !== workspaceId)))) {
    throw new ForbiddenException()
  }
}
function requireAdmin(req: ApiRequest) {
  if (!req.apiPrincipal?.admin) throw new ForbiddenException()
}
function identifier(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(value)) throw new BadRequestException('Invalid identifier')
  return value
}
function validName(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 100) throw new BadRequestException('Invalid name')
  return value.trim()
}
function validEmail(value: unknown): string {
  if (typeof value !== 'string' || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) throw new BadRequestException('Invalid email')
  return value.trim().toLowerCase()
}
@Controller('api/v1')
@UseGuards(RestApiKeyGuard)
export class RestApiController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly teams: TeamService,
    private readonly users: UserService,
    private readonly projects: ProjectService,
    private readonly forms: FormService,
    private readonly submissions: SubmissionService,
    private readonly integrations: IntegrationService,
    private readonly apps: AppService
  ) {}
  @Get('health')
  health() { return { status: 'ok', version: 'v1' } }

  @Post('keys')
  async createKey(@Req() req: ApiRequest, @Body() body: any) {
    requireAdmin(req)
    const workspaceId = identifier(body?.workspaceId)
    if (!await this.teams.findById(workspaceId)) throw new NotFoundException()
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 100 ||
        !Array.isArray(body.scopes) || !body.scopes.length || !body.scopes.every((s: unknown) => typeof s === 'string' && scopes.includes(s))) {
      throw new BadRequestException('Invalid name or scopes')
    }
    const token = 'hf_' + randomBytes(32).toString('hex')
    const id = hash(token)
    const key = { id, name: body.name.trim(), workspaceId, scopes: [...new Set(body.scopes)], createdAt: new Date(), revokedAt: null }
    await this.connection.collection('rest_api_keys').insertOne({ _id: id as any, ...key })
    return { ...key, token }
  }
  @Get('keys')
  async listKeys(@Req() req: ApiRequest) {
    requireAdmin(req)
    return this.connection.collection('rest_api_keys').find({}, { projection: { _id: 0 } }).limit(500).toArray()
  }
  @Delete('keys/:id')
  async revokeKey(@Req() req: ApiRequest, @Param('id') id: string) {
    requireAdmin(req)
    const result = await this.connection.collection('rest_api_keys').updateOne({ _id: identifier(id) as any }, { $set: { revokedAt: new Date() } })
    if (!result.matchedCount) throw new NotFoundException()
    return { revoked: true }
  }
  @Get('workspaces')
  async workspaces(@Req() req: ApiRequest) {
    requireScope(req, 'workspaces:read')
    const rows = req.apiPrincipal.admin ? await this.teams.findAllBy({}) : [await this.teams.findById(req.apiPrincipal.workspaceId)]
    return rows.filter(Boolean).map(t => ({ id: t.id, name: t.name, ownerId: t.ownerId }))
  }
  @Get('workspaces/:id/projects')
  async listProjects(@Req() req: ApiRequest, @Param('id') id: string) {
    requireScope(req, 'projects:read', id)
    if (!await this.teams.findById(identifier(id))) throw new NotFoundException()
    return (await this.projects.findAllInTeam(id)).map(p => ({ id: p.id, name: p.name, workspaceId: p.teamId, ownerId: p.ownerId }))
  }
  @Get('users')
  async findUser(@Req() req: ApiRequest, @Query('email') email: string) {
    requireScope(req, 'users:read')
    if (typeof email !== 'string' || email.length > 254 || !email.includes('@')) throw new BadRequestException('Email required')
    const user = await this.users.findByEmail(email.trim().toLowerCase())
    if (!user || (!req.apiPrincipal.admin && !await this.teams.findMemberById(req.apiPrincipal.workspaceId, user.id))) throw new NotFoundException()
    return { id: user.id, name: user.name, email: user.email }
  }
  @Post('workspaces/:id/members')
  async addMember(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    requireScope(req, 'members:write', id)
    const memberId = identifier(body?.userId)
    const team = await this.teams.findById(identifier(id))
    const user = await this.users.findById(memberId)
    if (!team || !user || user.isBlocked || user.isDeletionScheduled) throw new NotFoundException()
    const existing = await this.teams.findMemberById(id, memberId)
    if (!existing) {
      try {
        await this.teams.createMember({ teamId: id, memberId, role: TeamRoleEnum.COLLABORATOR })
      } catch (error) {
        if ((error as { code?: number })?.code !== 11000) throw error
      }
    }
    await this.projects.addMemberToDefaultProject(id, memberId)
    return { userId: memberId, workspaceId: id }
  }
  @Post('workspaces')
  async createWorkspace(@Req() req: ApiRequest, @Body() body: any) {
    requireAdmin(req)
    const ownerId = identifier(body?.ownerId)
    const owner = await this.users.findById(ownerId)
    if (!owner || owner.isBlocked || owner.isDeletionScheduled) throw new NotFoundException('Owner not found')
    const name = validName(body?.name)
    const projectName = validName(body?.projectName ?? 'Default')
    const id = await this.teams.create({ name, ownerId, storageQuota: 0, allowJoinByInviteLink: false })
    try {
      await this.teams.createMember({ teamId: id, memberId: ownerId, role: TeamRoleEnum.ADMIN })
      await this.projects.createByNewTeam(id, ownerId, projectName)
    } catch (error) {
      // Best-effort cleanup on standalone MongoDB, which does not support transactions.
      for (const project of await this.projects.findAllInTeam(id)) {
        await this.projects.deleteAllMemberInProject(project.id)
        await this.projects.delete(project.id)
      }
      await this.teams.deleteAllMemberInTeam(id)
      await this.teams.delete(id)
      throw error
    }
    return { id, name, ownerId, projectId: (await this.projects.findDefaultInTeam(id))?.id }
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
  @Post('users')
  async provisionUser(@Req() req: ApiRequest, @Body() body: any) {
    requireAdmin(req)
    const email = validEmail(body?.email)
    const name = validName(body?.name)
    let user = await this.users.findByEmail(email)
    let created = false
    if (!user) {
      try {
        const id = await this.users.create({ email, name, avatar: gravatar(email), isEmailVerified: false })
        user = await this.users.findById(id)
        created = true
      } catch (error) {
        if ((error as { code?: number })?.code !== 11000) throw error
        user = await this.users.findByEmail(email)
      }
    }
    if (!user || user.isBlocked || user.isDeletionScheduled) throw new ForbiddenException()
    return { id: user.id, email: user.email, name: user.name, created }
  }
  @Get('users/:id')
  async getUser(@Req() req: ApiRequest, @Param('id') id: string) {
    requireScope(req, 'users:read')
    const user = await this.users.findById(identifier(id))
    if (!user || (!req.apiPrincipal.admin && !await this.teams.findMemberById(req.apiPrincipal.workspaceId, id))) throw new NotFoundException()
    return { id: user.id, name: user.name, email: user.email }
  }
  @Post('workspaces/:id/projects')
  async createProject(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    requireScope(req, 'projects:write', id)
    const team = await this.teams.findById(identifier(id))
    if (!team) throw new NotFoundException()
    const name = validName(body?.name)
    const projectId = await this.projects.create({ teamId: id, name, ownerId: team.ownerId })
    try {
      await this.projects.createMember({ projectId, memberId: team.ownerId })
    } catch (error) {
      await this.projects.delete(projectId)
      throw error
    }
    return { id: projectId, name, workspaceId: id, ownerId: team.ownerId }
  }
  @Get('workspaces/:id/members')
  async listMembers(@Req() req: ApiRequest, @Param('id') id: string) {
    requireScope(req, 'members:read', id)
    if (!await this.teams.findById(identifier(id))) throw new NotFoundException()
    return (await this.teams.findMembersInTeam(id)).map(m => ({ userId: m.memberId, role: m.role }))
  }
  @Patch('workspaces/:id/members/:userId')
  async updateMember(@Req() req: ApiRequest, @Param('id') id: string, @Param('userId') userId: string, @Body() body: any) {
    // Role elevation is reserved for the bootstrap administrator.
    requireAdmin(req)
    const team = await this.teams.findById(identifier(id))
    const member = await this.teams.findMemberById(id, identifier(userId))
    if (!team || !member) throw new NotFoundException()
    if (team.ownerId === userId || member.role === TeamRoleEnum.OWNER) throw new ForbiddenException('Cannot change owner')
    const role = body?.role
    if (![TeamRoleEnum.ADMIN, TeamRoleEnum.COLLABORATOR, TeamRoleEnum.MEMBER].includes(role)) throw new BadRequestException('Invalid role')
    await this.teams.updateMember(id, userId, { role })
    return { workspaceId: id, userId, role }
  }
  @Delete('workspaces/:id/members/:userId')
  async removeMember(@Req() req: ApiRequest, @Param('id') id: string, @Param('userId') userId: string) {
    requireScope(req, 'members:write', id)
    const team = await this.teams.findById(identifier(id))
    const member = await this.teams.findMemberById(id, identifier(userId))
    if (!team) throw new NotFoundException()
    if (team.ownerId === userId || member?.role === TeamRoleEnum.OWNER ||
        (!req.apiPrincipal.admin && member?.role === TeamRoleEnum.ADMIN)) throw new ForbiddenException()
    const projects = await this.projects.findAllInTeam(id)
    // Project ownership must be transferred before removing its owner.
    if (projects.some(p => p.ownerId === userId)) throw new ConflictException('Transfer project ownership first')
    await this.projects.deleteMemberInProjects(projects.map(p => p.id), userId)
    await this.teams.deleteMember(id, userId)
    return { removed: true, workspaceId: id, userId }
  }

  private async purgeForms(ids: string[]) {
    if (!ids.length) return
    await this.forms.updateMany(ids, { 'settings.active': false, status: FormStatusEnum.TRASH })
    await this.submissions.deleteAll(ids)
    await this.forms.delete(ids)
  }
  @Delete('workspaces/:id')
  async deleteWorkspace(@Req() req: ApiRequest, @Param('id') id: string) {
    requireAdmin(req)
    if (!await this.teams.findById(identifier(id))) throw new NotFoundException()
    await this.connection.collection('rest_api_keys').updateMany({ workspaceId: id, revokedAt: null }, { $set: { revokedAt: new Date() } })
    await this.purgeForms((await this.forms.findAllInTeam(id)).map(f => f.id))
    for (const project of await this.projects.findAllInTeam(id)) {
      await this.projects.deleteAllMemberInProject(project.id)
      await this.projects.delete(project.id)
    }
    for (const invitation of await this.teams.findInvitations(id)) {
      await this.teams.deleteInvitation(invitation.id)
    }
    await this.teams.deleteAllMemberInTeam(id)
    await this.teams.delete(id)
    return { deleted: true, workspaceId: id }
  }
  @Patch('projects/:id')
  async renameProject(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    const project = await this.projects.findById(identifier(id))
    if (!project) throw new NotFoundException()
    requireScope(req, 'projects:write', project.teamId)
    const name = validName(body?.name)
    await this.projects.update(id, { name })
    return { id, name }
  }
  @Delete('projects/:id')
  async deleteProject(@Req() req: ApiRequest, @Param('id') id: string) {
    requireAdmin(req)
    const project = await this.projects.findById(identifier(id))
    if (!project) throw new NotFoundException()
    await this.purgeForms((await this.forms.findAllInProject(id)).map(f => f.id))
    await this.projects.deleteAllMemberInProject(id)
    await this.projects.delete(id)
    return { deleted: true, projectId: id }
  }
  @Get('projects/:id/forms')
  async listForms(@Req() req: ApiRequest, @Param('id') id: string) {
    const project = await this.projects.findById(identifier(id))
    if (!project) throw new NotFoundException()
    requireScope(req, 'forms:read', project.teamId)
    return (await this.forms.findAll(id, FormStatusEnum.NORMAL)).map(f => ({ id: f.id, name: f.name, version: f.version, publishedAt: f.publishedAt }))
  }
  @Post('projects/:id/forms')
  async createForm(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    const project = await this.projects.findById(identifier(id))
    if (!project) throw new NotFoundException()
    requireScope(req, 'forms:write', project.teamId)
    const name = validName(body?.name)
    const drafts = [
      { id: nanoid(12), title: null, description: null, kind: FieldKindEnum.SHORT_TEXT, validations: { required: false } },
      { id: nanoid(12), title: ['Thank you!'], kind: FieldKindEnum.THANK_YOU }
    ]
    const formId = await this.forms.create({
      name, teamId: project.teamId, projectId: id, memberId: project.ownerId,
      fields: [], _drafts: JSON.stringify(drafts), fieldsUpdatedAt: 0,
      hiddenFields: [], version: 0, status: FormStatusEnum.NORMAL,
      settings: { active: false, captchaKind: CaptchaKindEnum.NONE, filterSpam: false, allowArchive: true, requirePassword: false, locale: 'en', enableQuestionList: true, enableNavigationArrows: true, enableEmailNotification: true }
    })
    return { id: formId, name, projectId: id, workspaceId: project.teamId }
  }
  @Patch('forms/:id')
  async renameForm(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'forms:write', form.teamId)
    const name = validName(body?.name)
    await this.forms.update(id, { name })
    return { id, name }
  }
  @Post('forms/:id/duplicate')
  async duplicateForm(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'forms:write', form.teamId)
    if (form.status !== FormStatusEnum.NORMAL) throw new ConflictException('Invalid form status')
    const name = validName(body?.name)
    const project = await this.projects.findById(form.projectId)
    if (!project || project.teamId !== form.teamId) throw new ConflictException('Invalid source project')
    const copy: any = {}
    for (const field of ['variables', 'logics', 'draftLogics', 'translations', 'hiddenFields', '_drafts', 'kind', 'interactiveMode', 'themeSettings']) {
      const value = form.get(field)
      if (value !== undefined) copy[field] = value
    }
    const settings = form.settings ? JSON.parse(JSON.stringify(form.settings)) : {}
    delete settings.password
    const formId = await this.forms.create({
      ...copy, name, teamId: form.teamId, projectId: project.id, memberId: project.ownerId,
      fields: [], _drafts: copy._drafts || JSON.stringify(form.fields || []),
      fieldsUpdatedAt: 0, version: 0, status: FormStatusEnum.NORMAL,
      settings: { ...settings, active: false, requirePassword: false }
    })
    return { id: formId, name, projectId: project.id, workspaceId: form.teamId, active: false }
  }
  @Post('forms/:id/move')
  async moveForm(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'forms:write', form.teamId)
    if (form.status !== FormStatusEnum.NORMAL) throw new ConflictException('Invalid form status')
    const project = await this.projects.findById(identifier(body?.targetProjectId))
    if (!project) throw new NotFoundException()
    if (project.teamId !== form.teamId) throw new ForbiddenException('Cross-workspace movement is not permitted')
    await this.forms.update(id, { projectId: project.id })
    return { id, projectId: project.id, workspaceId: form.teamId }
  }
  private async editableForm(req: ApiRequest, id: string) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'forms:write', form.teamId)
    if (form.status !== FormStatusEnum.NORMAL) throw new ConflictException('Invalid form status')
    return form
  }
  @Patch('forms/:id/hidden-fields')
  async updateHiddenFields(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    await this.editableForm(req, id)
    if (!Array.isArray(body?.hiddenFields) || body.hiddenFields.length > 200) throw new BadRequestException('Invalid hidden fields')
    const hiddenFields = body.hiddenFields.map((f: any) => ({ id: identifier(f?.id), name: validName(f?.name) }))
    if (new Set(hiddenFields.map(f => f.id)).size !== hiddenFields.length || new Set(hiddenFields.map(f => f.name)).size !== hiddenFields.length) throw new BadRequestException('Duplicate hidden fields')
    await this.forms.update(id, { hiddenFields })
    return { id, hiddenFields }
  }
  @Patch('forms/:id/variables')
  async updateVariables(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    await this.editableForm(req, id)
    if (!Array.isArray(body?.variables) || body.variables.length > 200) throw new BadRequestException('Invalid variables')
    const variables = body.variables.map((v: any) => {
      if (!v || !['string', 'number'].includes(v.kind) || typeof v.value !== v.kind || (v.kind === 'number' && !Number.isFinite(v.value))) throw new BadRequestException('Invalid variable')
      return { id: identifier(v.id), name: validName(v.name), kind: v.kind, value: v.value }
    })
    if (new Set(variables.map(v => v.id)).size !== variables.length) throw new BadRequestException('Duplicate variables')
    await this.forms.update(id, { variables })
    return { id, variables }
  }
  @Patch('forms/:id/settings')
  async updateSettings(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    const form = await this.editableForm(req, id)
    const booleans = ['enableExpirationDate','enableTimeLimit','filterSpam','generatePseudonymId','enableQuotaLimit','enableIpLimit','displayIpAddress','enableProgress','enableQuestionList','enableNavigationArrows','openLinksInNewTab','enableClosedMessage','allowArchive','requirePassword','enableEmailNotification','redirectOnCompletion']
    const numbers = ['enabledAt','closedAt','timeLimit','quotaLimit','ipLimitCount','ipLimitTime','redirectDelay']
    const strings = ['expirationTimeZone','locale','closedFormTitle','closedFormDescription','metaTitle','metaDescription','redirectUrl','metaOGImageUrl']
    if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.keys(body).length) throw new BadRequestException('Settings required')
    const updates: Record<string, any> = {}
    for (const [key, value] of Object.entries(body)) {
      if (booleans.includes(key) && typeof value === 'boolean') updates['settings.' + key] = value
      else if (numbers.includes(key) && typeof value === 'number' && Number.isSafeInteger(value) && value >= (['quotaLimit','ipLimitCount'].includes(key) ? 1 : 0)) updates['settings.' + key] = value
      else if (strings.includes(key) && typeof value === 'string') {
        if (['redirectUrl','metaOGImageUrl'].includes(key)) {
          try { if (!['http:', 'https:'].includes(new URL(value).protocol)) throw new Error() } catch { throw new BadRequestException('Invalid URL') }
        }
        updates['settings.' + key] = value
      } else if (key === 'password' && typeof value === 'string' && value.length >= 1 && value.length <= 72) updates['settings.password'] = await passwordHash(value, BCRYPT_SALT)
      else throw new BadRequestException('Invalid or unsupported setting: ' + key)
    }
    if (body.requirePassword === true && !updates['settings.password'] && !form.settings?.password) throw new BadRequestException('Password required')
    await this.forms.update(id, updates)
    return { id, updated: true }
  }
  @Patch('forms/:id/theme')
  async updateTheme(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    await this.editableForm(req, id)
    const theme = body?.theme
    if (!theme || typeof theme !== 'object' || Array.isArray(theme)) throw new BadRequestException('Theme required')
    const allowed = ['fontFamily','questionTextColor','answerTextColor','buttonBackground','buttonTextColor','backgroundColor','backgroundImage','backgroundBrightness','customCSS']
    for (const [key,value] of Object.entries(theme)) {
      if (!allowed.includes(key) || (key === 'backgroundBrightness' ? typeof value !== 'number' || !Number.isFinite(value) || value < -100 || value > 100 : typeof value !== 'string' || !(key === 'customCSS' ? isSafeCustomCSS(value) : isSafeCSSValue(value)))) throw new BadRequestException('Invalid theme property: ' + key)
    }
    const updates: Record<string, any> = { 'themeSettings.theme': theme }
    for (const key of ['logo','favicon']) {
      if (body[key] === undefined) continue
      if (body[key] !== null) {
        try { if (typeof body[key] !== 'string' || !['http:', 'https:'].includes(new URL(body[key]).protocol)) throw new Error() } catch { throw new BadRequestException('Invalid image URL') }
      }
      updates['themeSettings.' + key] = body[key]
    }
    await this.forms.update(id, updates)
    return { id, updated: true }
  }
  @Post('forms/:id/trash')
  async trashForm(@Req() req: ApiRequest, @Param('id') id: string) {
    await this.editableForm(req, id)
    await this.forms.update(id, { retentionAt: timestamp() + 30 * 86400, 'settings.active': false, status: FormStatusEnum.TRASH })
    return { id, trashed: true }
  }
  @Post('forms/:id/restore')
  async restoreForm(@Req() req: ApiRequest, @Param('id') id: string) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'forms:write', form.teamId)
    if (form.status !== FormStatusEnum.TRASH) throw new ConflictException('Form is not in trash')
    await this.forms.update(id, { retentionAt: -1, status: FormStatusEnum.NORMAL, 'settings.active': false })
    return { id, restored: true }
  }
  @Patch('forms/:id/drafts')
  async updateDrafts(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'forms:write', form.teamId)
    if (form.status !== FormStatusEnum.NORMAL || !Number.isSafeInteger(body?.version) || body.version !== form.version) throw new ConflictException('Invalid draft version or form status')
    if (!Array.isArray(body.drafts) || (body.logics != null && !Array.isArray(body.logics))) throw new BadRequestException('Invalid drafts or logics')
    const drafts = sanitizeFormDrafts(body.drafts)
    assertValidFormNavigation(drafts)
    const logics = body.logics ?? form.draftLogics ?? form.logics ?? []
    assertValidChoiceBranching(drafts, logics)
    await this.forms.update(id, { _drafts: JSON.stringify(drafts), draftLogics: logics, fieldsUpdatedAt: timestamp(), version: body.version + 1 })
    return { id, drafts, version: body.version + 1 }
  }
  @Post('forms/:id/publish')
  async publishForm(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'forms:write', form.teamId)
    if (form.status !== FormStatusEnum.NORMAL || !Number.isSafeInteger(body?.version) || body.version !== form.version) throw new ConflictException('Invalid draft version or form status')
    if (!Array.isArray(body.drafts) || (body.logics != null && !Array.isArray(body.logics))) throw new BadRequestException('Invalid drafts or logics')
    const drafts = sanitizeFormDrafts(body.drafts)
    assertValidFormNavigation(drafts)
    const logics = body.logics ?? form.draftLogics ?? form.logics ?? []
    assertValidChoiceBranching(drafts, logics)
    const now = timestamp()
    const updates: Record<string, any> = { fields: drafts, logics, draftLogics: logics, _drafts: JSON.stringify(drafts), fieldsUpdatedAt: now, version: body.version, 'settings.active': true }
    if (!form.publishedAt) updates.publishedAt = now
    const user = await this.users.findById(form.memberId)
    if (!user) throw new ConflictException('Form creator not found')
    if (helper.isValidArray(form.settings?.languages)) {
      await this.forms.addTranslateQueue(id, form.teamId, user.id, form.settings!.languages)
    }
    if (!user.hasPublishedForm) await this.users.update(user.id, { publishedFormAt: now })
    await this.forms.update(id, updates)
    return { id, active: true, version: body.version, publishedAt: updates.publishedAt ?? form.publishedAt }
  }
  @Post('forms/:id/unpublish')
  async unpublishForm(@Req() req: ApiRequest, @Param('id') id: string) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'forms:write', form.teamId)
    await this.forms.update(id, { 'settings.active': false })
    return { id, active: false }
  }
  @Delete('forms/:id')
  async deleteForm(@Req() req: ApiRequest, @Param('id') id: string) {
    requireAdmin(req)
    if (!await this.forms.findById(identifier(id))) throw new NotFoundException()
    await this.purgeForms([id])
    return { id, deleted: true }
  }
  private async submissionForm(req: ApiRequest, id: string, scope: string) {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, scope, form.teamId)
    return form
  }
  @Get('forms/:id/submissions/:submissionId')
  async getSubmission(@Req() req: ApiRequest, @Param('id') id: string, @Param('submissionId') submissionId: string) {
    await this.submissionForm(req, id, 'submissions:read')
    if (!/^[a-fA-F0-9]{24}$/.test(submissionId)) throw new BadRequestException('Invalid submission ID')
    const row = await this.submissions.findByFormId(id, submissionId)
    if (!row || row.status !== SubmissionStatusEnum.PUBLIC) throw new NotFoundException()
    return { id: row.id, formId: row.formId, category: row.category, title: row.title, answers: row.answers, hiddenFields: row.hiddenFields, variables: row.variables, startAt: row.startAt, endAt: row.endAt, pseudonymId: row.pseudonymId }
  }
  @Patch('forms/:id/submissions/:submissionId/category')
  async updateSubmissionCategory(@Req() req: ApiRequest, @Param('id') id: string, @Param('submissionId') submissionId: string, @Body() body: any) {
    await this.submissionForm(req, id, 'submissions:write')
    if (!/^[a-fA-F0-9]{24}$/.test(submissionId) || !Object.values(SubmissionCategoryEnum).includes(body?.category)) throw new BadRequestException('Invalid submission ID or category')
    const row = await this.submissions.findByFormId(id, submissionId)
    if (!row || row.status !== SubmissionStatusEnum.PUBLIC) throw new NotFoundException()
    if (!await this.submissions.updateCategory({ formId: id, submissionIds: [submissionId], category: body.category })) throw new NotFoundException()
    return { id: submissionId, category: body.category }
  }
  @Delete('forms/:id/submissions/:submissionId')
  async deleteSubmission(@Req() req: ApiRequest, @Param('id') id: string, @Param('submissionId') submissionId: string) {
    requireAdmin(req)
    await this.submissionForm(req, id, 'submissions:read')
    if (!/^[a-fA-F0-9]{24}$/.test(submissionId)) throw new BadRequestException('Invalid submission ID')
    if (!await this.submissions.deleteByIds(id, [submissionId])) throw new NotFoundException()
    return { id: submissionId, deleted: true }
  }
  @Get('forms/:id/webhook')
  async getWebhook(@Req() req: ApiRequest, @Param('id') id: string) {
    await this.submissionForm(req, id, 'webhooks:read')
    const integration = await this.integrations.findOne(id, 'webhook')
    if (!integration) throw new NotFoundException()
    return { formId: id, status: integration.status, endpointUrl: mapToObject(integration.config).endpointUrl, signed: !!mapToObject(integration.config).signingSecretEncrypted }
  }
  @Post('forms/:id/webhook')
  async configureWebhook(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    const form = await this.submissionForm(req, id, 'webhooks:write')
    if (form.status !== FormStatusEnum.NORMAL) throw new ConflictException('Invalid form status')
    const app = this.apps.findById('webhook')
    if (!app || !this.apps.isAvailable(app)) throw new BadRequestException('Webhook unavailable')
    const endpointUrl = body?.endpointUrl
    if (typeof endpointUrl !== 'string' || endpointUrl.length > 2048) throw new BadRequestException('Invalid endpoint URL')
    try {
      const url = new URL(endpointUrl)
      if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error()
      await assertSafeOutboundUrl(endpointUrl)
    } catch { throw new BadRequestException('Webhook requires a safe public HTTPS endpoint') }
    const existing = await this.integrations.findOne(id, 'webhook')
    const config: Record<string, any> = { endpointUrl }
    const previous = existing ? mapToObject(existing.config).signingSecretEncrypted : undefined
    if (previous) config.signingSecretEncrypted = previous
    if (body.signingSecret !== undefined) {
      if (typeof body.signingSecret !== 'string' || body.signingSecret.length < 32 || body.signingSecret.length > 256) throw new BadRequestException('Signing secret must be 32–256 characters')
      if (!integrationSecrets.isConfigured) throw new BadRequestException('Integration encryption key is not configured')
      config.signingSecretEncrypted = integrationSecrets.encrypt(body.signingSecret)
    }
    await this.integrations.createOrUpdate(id, 'webhook', { config, status: IntegrationStatusEnum.ACTIVE })
    return { formId: id, status: IntegrationStatusEnum.ACTIVE, signed: !!config.signingSecretEncrypted }
  }
  @Delete('forms/:id/webhook')
  async disableWebhook(@Req() req: ApiRequest, @Param('id') id: string) {
    await this.submissionForm(req, id, 'webhooks:write')
    const integration = await this.integrations.findOne(id, 'webhook')
    if (!integration) throw new NotFoundException()
    await this.integrations.update(integration.id, { status: IntegrationStatusEnum.DISABLED })
    return { formId: id, status: IntegrationStatusEnum.DISABLED }
  }
  @Get('forms/:id/webhook/deliveries')
  async webhookDeliveries(@Req() req: ApiRequest, @Param('id') id: string) {
    await this.submissionForm(req, id, 'webhooks:read')
    const records = await this.integrations.findRecords(id, 'webhook', 100)
    return records.map(row => ({ id: row.id, submissionId: row.submissionId, status: row.status, attempt: row.attempt, maxAttempts: row.maxAttempts, willRetry: !!row.willRetry, createdAt: row.createdAt }))
  }
  @Patch('forms/:id/submissions/:submissionId/answer')
  async editSubmissionAnswer(@Req() req: ApiRequest, @Param('id') id: string, @Param('submissionId') submissionId: string, @Body() body: any) {
    const form = await this.submissionForm(req, id, 'submissions:write')
    if (!/^[a-fA-F0-9]{24}$/.test(submissionId)) throw new BadRequestException('Invalid submission ID')
    const row = await this.submissions.findByFormId(id, submissionId)
    if (!row || row.status !== SubmissionStatusEnum.PUBLIC) throw new NotFoundException()
    const rule = fieldsToValidateRules(flattenFields(form.fields, true)).find(r => r.id === body?.fieldId)
    if (!rule || !Object.prototype.hasOwnProperty.call(body, 'value')) throw new BadRequestException('Invalid field or missing value')
    try {
      assertSafeSpecialFieldAnswers([rule], { [rule.id]: body.value })
      validate(rule, body.value)
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      if (error instanceof ValidateError) throw new BadRequestException(error.response)
      throw error
    }
    const answer = { id: rule.id, kind: rule.kind, properties: rule.properties || {}, title: rule.title, value: body.value }
    const updated = row.answers.some(a => a.id === rule.id) ? await this.submissions.updateAnswer(submissionId, answer) : await this.submissions.createAnswer(submissionId, answer)
    if (!updated) throw new ConflictException('Answer update failed')
    return { id: submissionId, updated: true }
  }
  @Get('forms/:id/submissions')
  async listSubmissions(@Req() req: ApiRequest, @Param('id') id: string, @Query('page') page = '1', @Query('limit') limit = '30') {
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'submissions:read', form.teamId)
    const p = Number(page), l = Number(limit)
    if (!Number.isSafeInteger(p) || p < 1 || p > 1000000 || !Number.isSafeInteger(l) || l < 1 || l > 100) throw new BadRequestException('Invalid pagination')
    const total = await this.submissions.count({ formId: id })
    const submissions = await this.submissions.findAll({ formId: id, page: p, limit: l, withIp: false })
    return { total, page: p, limit: l, submissions }
  }
  @Get('forms/:id')
  async getForm(@Req() req: ApiRequest, @Param('id') id: string) {
    requireScope(req, 'forms:read')
    const form = await this.forms.findById(identifier(id))
    if (!form) throw new NotFoundException()
    requireScope(req, 'forms:read', form.teamId)
    return { id: form.id, name: form.name, workspaceId: form.teamId, projectId: form.projectId, fields: form.fields, drafts: form.get('drafts'), hiddenFields: form.hiddenFields, variables: form.variables, logics: form.logics, draftLogics: form.draftLogics, themeSettings: form.themeSettings, status: form.status, active: form.settings?.active, version: form.version, publishedAt: form.publishedAt }
  }
}
@Module({})
export class RestApiModule {
  static register(serviceModule: Type<any>): DynamicModule {
    return { module: RestApiModule, imports: [serviceModule], controllers: [RestApiController, RestApiDocsController, WorkspaceApiUiController], providers: [RestApiKeyGuard, WorkspaceApiUiGuard, AuthGuard] }
  }
}
