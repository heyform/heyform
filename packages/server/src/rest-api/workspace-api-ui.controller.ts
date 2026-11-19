import { Body, Controller, Delete, Get, Param, Post, UseGuards, BadRequestException, NotFoundException, Header } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'
import { createHash, randomBytes } from 'crypto'
import { WorkspaceApiUiGuard } from './workspace-api-ui.guard'
import { RestApiDocsController } from './rest-api-docs.controller'

const scopes = ['workspaces:read', 'users:read', 'projects:read', 'forms:read', 'members:write', 'members:read', 'workspaces:write', 'projects:write', 'forms:write', 'submissions:read']

@Controller('api/v1/workspaces/:workspaceId/api')
@UseGuards(WorkspaceApiUiGuard)
export class WorkspaceApiUiController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get('documentation')
  @Header('Cache-Control', 'no-store')
  documentation() {
    return new RestApiDocsController().specification()
  }

  @Get('keys')
  @Header('Cache-Control', 'no-store')
  async list(@Param('workspaceId') workspaceId: string) {
    return this.connection.collection('rest_api_keys').find({ workspaceId }, { projection: { _id: 0 } }).limit(500).toArray()
  }

  @Post('keys')
  @Header('Cache-Control', 'no-store')
  async create(@Param('workspaceId') workspaceId: string, @Body() body: any) {
    if (typeof body?.name !== 'string' || !body.name.trim() || body.name.length > 100 ||
        !Array.isArray(body.scopes) || !body.scopes.length ||
        !body.scopes.every((scope: unknown) => typeof scope === 'string' && scopes.includes(scope))) {
      throw new BadRequestException('Invalid name or scopes')
    }
    const token = 'hf_' + randomBytes(32).toString('hex')
    const id = createHash('sha256').update(token).digest('hex')
    const key = { id, name: body.name.trim(), workspaceId, scopes: [...new Set(body.scopes)], createdAt: new Date(), revokedAt: null }
    await this.connection.collection('rest_api_keys').insertOne({ _id: id as any, ...key })
    return { ...key, token }
  }

  @Delete('keys/:id')
  @Header('Cache-Control', 'no-store')
  async revoke(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    if (!/^[a-f0-9]{64}$/.test(id)) throw new NotFoundException()
    const result = await this.connection.collection('rest_api_keys').updateOne(
      { _id: id as any, workspaceId }, { $set: { revokedAt: new Date() } })
    if (!result.matchedCount) throw new NotFoundException()
    return { revoked: true }
  }
}
