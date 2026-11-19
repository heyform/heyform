import { RestApiDocsController } from './rest-api-docs.controller'
import { BadRequestException, Body, CanActivate, Controller, ConflictException, Patch, Delete, ExecutionContext, ForbiddenException, Get, Injectable, Module, NotFoundException, Param, Post, Query, Req, UnauthorizedException, UseGuards, DynamicModule, Type } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'
import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { Request } from 'express'
import { TeamService, UserService, ProjectService, FormService, SubmissionService } from '../service'
import { FormStatusEnum, CaptchaKindEnum, FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { nanoid, timestamp, helper } from '@heyform-inc/utils'
import { assertValidChoiceBranching, assertValidFormNavigation, sanitizeFormDrafts, gravatar } from '@utils'
import { TeamRoleEnum } from '../model/team-member.model'

const scopes = ['workspaces:read', 'users:read', 'projects:read', 'forms:read', 'members:write', 'members:read', 'workspaces:write', 'projects:write', 'forms:write', 'submissions:read']
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
@Injectable()
export class RestApiKeyGuard implements CanActivate {
  constructor(@InjectConnection() private readonly connection: Connection) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<ApiRequest>()
    const token = req.headers.authorization?.match(/^Bearer ([^\s]+)$/i)?.[1]
    if (!token || token.length > 512) throw new UnauthorizedException()
    const configured = process.env.HEYFORM_REST_API_KEY
    if (configured && configured.length >= 32 && timingSafeEqual(Buffer.from(hash(configured)), Buffer.from(hash(token)))) {
      req.apiPrincipal = { admin: true, scopes: [] }
      return true
    }
    const key = await this.connection.collection('rest_api_keys').findOne({ _id: hash(token) as any, revokedAt: null })
    if (!key) throw new UnauthorizedException()
    req.apiPrincipal = { admin: false, workspaceId: key.workspaceId, scopes: key.scopes }
    return true
  }
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
    private readonly submissions: SubmissionService
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
    return { id: form.id, name: form.name, workspaceId: form.teamId, projectId: form.projectId, fields: form.fields, drafts: form.get('drafts'), version: form.version, publishedAt: form.publishedAt }
  }
}
@Module({})
export class RestApiModule {
  static register(serviceModule: Type<any>): DynamicModule {
    return { module: RestApiModule, imports: [serviceModule], controllers: [RestApiController, RestApiDocsController], providers: [RestApiKeyGuard] }
  }
}
