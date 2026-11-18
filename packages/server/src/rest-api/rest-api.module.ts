import { BadRequestException, Body, CanActivate, Controller, Delete, ExecutionContext, ForbiddenException, Get, Injectable, Module, NotFoundException, Param, Post, Query, Req, UnauthorizedException, UseGuards, DynamicModule, Type } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'
import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { Request } from 'express'
import { TeamService, UserService, ProjectService, FormService } from '../service'
import { TeamRoleEnum } from '../model/team-member.model'

const scopes = ['workspaces:read', 'users:read', 'projects:read', 'forms:read', 'members:write']
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
        !Array.isArray(body.scopes) || !body.scopes.length || !body.scopes.every(s => scopes.includes(s))) {
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
        if (error?.code !== 11000) throw error
      }
    }
    await this.projects.addMemberToDefaultProject(id, memberId)
    return { userId: memberId, workspaceId: id }
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
