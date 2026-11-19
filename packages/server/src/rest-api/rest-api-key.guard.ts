import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'
import { createHash, timingSafeEqual } from 'crypto'
import { Request } from 'express'

const hash = (value: string) => createHash('sha256').update(value).digest('hex')
export type ApiRequest = Request & { apiPrincipal?: { admin: boolean; workspaceId?: string; scopes: string[] } }
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
