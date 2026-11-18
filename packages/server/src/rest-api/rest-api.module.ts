import { BadRequestException, Body, CanActivate, Controller, ConflictException, Patch, Delete, ExecutionContext, ForbiddenException, Get, Injectable, Module, NotFoundException, Param, Post, Query, Req, UnauthorizedException, UseGuards, DynamicModule, Type } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'
import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { Request } from 'express'
import { TeamService, UserService, ProjectService, FormService } from '../service'
import { TeamRoleEnum } from '../model/team-member.model'

const scopes = ['workspaces:read', 'users:read', 'projects:read', 'forms:read', 'members:write', 'members:read', 'workspaces:write', 'projects:write']
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
    private readonly forms: FormService
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
    const id = await this.teams.create({ name, ownerId, allowJoinByInviteLink: false })
    try {
      await this.teams.createMember({ teamId: id, memberId: ownerId, role: TeamRoleEnum.OWNER })
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
        const id = await this.users.create({ email, name, isEmailVerified: false })
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
    return { module: RestApiModule, imports: [serviceModule], controllers: [RestApiController], providers: [RestApiKeyGuard] }
  }
}
