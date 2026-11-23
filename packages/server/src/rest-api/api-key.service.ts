import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { createHash } from 'crypto'
import { Document, Model } from 'mongoose'

import { nanoid, timestamp } from '@heyform-inc/utils'
import { isTeamOwner } from '@model'
import { ProjectService, TeamService } from '@service'

export const API_KEY_SCOPES = [
  'workspaces:read',
  'workspaces:write',
  'users:read',
  'projects:read',
  'projects:write',
  'forms:read',
  'forms:write',
  'members:read',
  'members:write',
  'submissions:read',
  'submissions:write'
] as const

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number]
type WorkspaceAccess = 'all' | 'selected'

const workspaceScopes = new Set<ApiKeyScope>([
  'workspaces:read',
  'projects:read',
  'projects:write',
  'users:read',
  'members:read'
])
const ownerScopes = new Set<ApiKeyScope>(['workspaces:write', 'members:write'])
const projectScopes = new Set<ApiKeyScope>([
  'forms:read',
  'forms:write',
  'submissions:read',
  'submissions:write'
])

export interface WorkspaceApiAccess {
  id: string
  name: string
  scopes: ApiKeyScope[]
  projectIds: Set<string>
}

export const hashApiKey = (value: string) => createHash('sha256').update(value).digest('hex')

@Schema({ collection: 'apikeys' })
export class ApiKey extends Document {
  @Prop({ required: true, index: true })
  ownerId: string

  @Prop({ required: true, unique: true, select: false })
  tokenHash: string

  @Prop({ type: String, default: null })
  tokenPrefix: string | null

  @Prop({ type: String, default: null })
  tokenSuffix: string | null

  @Prop({ required: true })
  name: string

  @Prop({ type: [String], required: true })
  scopes: ApiKeyScope[]

  @Prop({ type: String, enum: ['all', 'selected'], required: true })
  workspaceAccess: WorkspaceAccess

  @Prop({ type: [String], default: [] })
  workspaceIds: string[]

  @Prop({ type: Date, default: Date.now })
  createdAt: Date

  @Prop({ type: Number, default: null })
  expiresAt: number | null

  @Prop({ type: Date, default: null })
  revokedAt: Date | null
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey)

function keyDetails(key: ApiKey) {
  const {
    id,
    name,
    scopes,
    workspaceAccess,
    workspaceIds,
    createdAt,
    expiresAt,
    revokedAt,
    tokenPrefix,
    tokenSuffix
  } = key
  return {
    id,
    name,
    scopes,
    workspaceAccess,
    workspaceIds,
    createdAt,
    expiresAt,
    revokedAt,
    tokenPrefix: tokenPrefix ?? null,
    tokenSuffix
  }
}

function generateToken() {
  const secret = nanoid(64)
  const token = `ak-heyform-${secret}`
  return {
    token,
    tokenHash: hashApiKey(token),
    tokenPrefix: secret.slice(0, 8),
    tokenSuffix: secret.slice(-8)
  }
}

function ownedKey(ownerId: string, id: string) {
  if (!/^[a-f0-9]{24}$/.test(id)) throw new NotFoundException()
  return { _id: id, ownerId }
}

function activeKey() {
  return { revokedAt: null, $or: [{ expiresAt: null }, { expiresAt: { $gt: timestamp() } }] }
}

function expirationTimestamp(body: Record<string, unknown> | undefined, now: Date): number | null {
  const { expiration = '1m', expiresOn } = body ?? {}
  if (expiration === 'never') return null

  let expiresAt: Date
  if (expiration === 'custom') {
    if (typeof expiresOn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(expiresOn)) {
      throw new BadRequestException('A valid expiration date is required')
    }
    expiresAt = new Date(expiresOn + 'T00:00:00.000Z')
    if (
      !Number.isFinite(expiresAt.getTime()) ||
      expiresAt.toISOString().slice(0, 10) !== expiresOn
    ) {
      throw new BadRequestException('Invalid expiration date')
    }
    expiresAt.setUTCDate(expiresAt.getUTCDate() + 1)
    if (expiresAt <= now) throw new BadRequestException('The expiration date has passed')
  } else if (expiration === '1m' || expiration === '1y') {
    const day = now.getUTCDate()
    expiresAt = new Date(now)
    expiresAt.setUTCDate(1)
    expiresAt.setUTCMonth(expiresAt.getUTCMonth() + (expiration === '1m' ? 1 : 12))
    const lastDay = new Date(expiresAt)
    lastDay.setUTCMonth(lastDay.getUTCMonth() + 1, 0)
    expiresAt.setUTCDate(Math.min(day, lastDay.getUTCDate()))
  } else {
    throw new BadRequestException('Invalid expiration option')
  }

  return Math.floor(expiresAt.getTime() / 1000)
}

function isScope(scope: unknown): scope is ApiKeyScope {
  return typeof scope === 'string' && API_KEY_SCOPES.some(allowed => allowed === scope)
}

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectModel(ApiKey.name) private readonly keys: Model<ApiKey>,
    private readonly teams: TeamService,
    private readonly projects: ProjectService
  ) {}

  private async workspaceAccess(ownerId: string): Promise<WorkspaceApiAccess[]> {
    const workspaces = await this.teams.findAll(ownerId)
    const projects = await this.projects.findAccessibleInTeams(ownerId, workspaces)
    const projectsByWorkspace = new Map<string, Set<string>>()
    for (const project of projects) {
      const ids = projectsByWorkspace.get(project.teamId) ?? new Set<string>()
      ids.add(project.id)
      projectsByWorkspace.set(project.teamId, ids)
    }

    return workspaces.map(workspace => {
      const projectIds = projectsByWorkspace.get(workspace.id) ?? new Set<string>()
      const scopes = API_KEY_SCOPES.filter(
        scope =>
          workspaceScopes.has(scope) ||
          (isTeamOwner(workspace, ownerId) && ownerScopes.has(scope)) ||
          (projectIds.size > 0 && projectScopes.has(scope))
      )
      return { id: workspace.id, name: workspace.name, scopes, projectIds }
    })
  }

  async accountAccess(ownerId: string) {
    const [keys, workspaces] = await Promise.all([
      this.keys.find({ ownerId }).sort({ createdAt: -1, _id: -1 }),
      this.workspaceAccess(ownerId)
    ])

    return {
      keys: keys.map(keyDetails),
      workspaces: workspaces.map(({ id, name, scopes }) => ({ id, name, scopes })),
      scopes: API_KEY_SCOPES
    }
  }

  private async validateAccess(ownerId: string, body: Record<string, unknown> | undefined) {
    const { scopes, workspaceAccess, workspaceIds } = body ?? {}
    if (
      !Array.isArray(scopes) ||
      !scopes.length ||
      !scopes.every(isScope) ||
      (workspaceAccess !== 'all' && workspaceAccess !== 'selected') ||
      !Array.isArray(workspaceIds) ||
      !workspaceIds.every(id => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id)) ||
      (workspaceAccess === 'selected' ? !workspaceIds.length : !!workspaceIds.length)
    ) {
      throw new BadRequestException('Invalid permissions or workspace selection')
    }

    const ids = new Set<string>(workspaceIds)
    const workspaces = (await this.workspaceAccess(ownerId)).filter(
      workspace => workspaceAccess === 'all' || ids.has(workspace.id)
    )
    if (!workspaces.length || (workspaceAccess === 'selected' && workspaces.length !== ids.size)) {
      throw new ForbiddenException('Workspace access denied')
    }
    if (workspaces.some(workspace => scopes.some(scope => !workspace.scopes.includes(scope)))) {
      throw new ForbiddenException('A selected permission is not available in every workspace')
    }

    return {
      scopes: [...new Set(scopes)],
      workspaceAccess,
      workspaceIds: [...ids]
    }
  }

  async create(ownerId: string, body: Record<string, unknown> | undefined) {
    const name = body?.name
    if (typeof name !== 'string' || !name.trim() || name.length > 100) {
      throw new BadRequestException('Invalid key name')
    }

    const access = await this.validateAccess(ownerId, body)
    const createdAt = new Date()
    const expiresAt = expirationTimestamp(body, createdAt)
    const { token, ...credentials } = generateToken()
    const key = await this.keys.create({
      ownerId,
      name: name.trim(),
      createdAt,
      expiresAt,
      ...access,
      ...credentials
    })
    return { ...keyDetails(key), token }
  }

  async update(ownerId: string, id: string, body: Record<string, unknown> | undefined) {
    const filter = ownedKey(ownerId, id)
    const access = await this.validateAccess(ownerId, body)
    const key = await this.keys.findOneAndUpdate(
      { ...filter, ...activeKey() },
      { $set: access },
      { new: true }
    )
    if (!key) throw new NotFoundException()
    return keyDetails(key)
  }

  async regenerate(ownerId: string, id: string) {
    const filter = ownedKey(ownerId, id)
    const current = await this.keys.findOne({ ...filter, ...activeKey() }).select('+tokenHash')
    if (!current) throw new NotFoundException()

    const { token, ...credentials } = generateToken()
    const key = await this.keys.findOneAndUpdate(
      { ...filter, ...activeKey(), tokenHash: current.tokenHash },
      { $set: credentials },
      { new: true }
    )
    if (!key) throw new ConflictException('API key changed. Refresh and try again.')
    return { ...keyDetails(key), token }
  }

  async delete(ownerId: string, id: string) {
    const result = await this.keys.deleteOne(ownedKey(ownerId, id))
    if (!result.deletedCount) throw new NotFoundException()
    return { deleted: true }
  }

  findActive(token: string) {
    return this.keys.findOne({ tokenHash: hashApiKey(token), ...activeKey() })
  }

  async allowedWorkspaces(key: ApiKey): Promise<Map<string, WorkspaceApiAccess>> {
    const workspaces = await this.workspaceAccess(key.ownerId)
    return new Map(
      workspaces
        .filter(
          workspace => key.workspaceAccess === 'all' || key.workspaceIds.includes(workspace.id)
        )
        .map(workspace => [workspace.id, workspace])
    )
  }
}
