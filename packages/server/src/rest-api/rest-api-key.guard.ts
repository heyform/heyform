import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Request } from 'express'

import { ApiKeyScope, ApiKeyService, WorkspaceApiAccess } from './api-key.service'
import { UserService } from '@service'

type Principal = {
  userId: string
  workspaces: Map<string, WorkspaceApiAccess>
  scopes: ApiKeyScope[]
}
export type ApiRequest = Request & { apiPrincipal?: Principal }

@Injectable()
export class RestApiKeyGuard implements CanActivate {
  constructor(
    private readonly keys: ApiKeyService,
    private readonly users: UserService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<ApiRequest>()
    const token = req.headers.authorization?.match(/^Bearer ([^\s]+)$/i)?.[1]
    if (!token || token.length > 512) throw new UnauthorizedException()

    if (!/^ak-heyform-[a-zA-Z0-9]{64}$/.test(token)) throw new UnauthorizedException()
    const key = await this.keys.findActive(token)
    if (!key) throw new UnauthorizedException()

    const owner = await this.users.findById(key.ownerId)
    if (!owner || owner.isBlocked || owner.isDeletionScheduled) throw new UnauthorizedException()

    req.apiPrincipal = {
      userId: owner.id,
      scopes: key.scopes,
      workspaces: await this.keys.allowedWorkspaces(key)
    }
    return true
  }
}
