import {
  Body,
  CanActivate,
  Controller,
  Delete,
  ExecutionContext,
  ForbiddenException,
  Get,
  Header,
  Injectable,
  Param,
  Patch,
  Post,
  Req,
  UseGuards
} from '@nestjs/common'
import { Request } from 'express'

import { ApiKeyService } from './api-key.service'
import { AuthGuard } from '@guard'
import { UserModel } from '@model'

type AccountRequest = Request & { user: UserModel }

@Injectable()
export class AccountApiKeysGuard implements CanActivate {
  constructor(private readonly auth: AuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AccountRequest>()
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (
        req.get('sec-fetch-site') !== 'same-origin' ||
        !req.get('origin') ||
        (['POST', 'PATCH'].includes(req.method) && !req.is('application/json'))
      ) {
        throw new ForbiddenException('Cross-origin or invalid administrative request')
      }
    }

    await this.auth.canActivate(context)
    if (req.user.isBlocked || req.user.isDeletionScheduled) throw new ForbiddenException()
    return true
  }
}

@Controller('api/v1/account/api-keys')
@UseGuards(AccountApiKeysGuard)
export class AccountApiKeysController {
  constructor(private readonly keys: ApiKeyService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  list(@Req() req: AccountRequest) {
    return this.keys.accountAccess(req.user.id)
  }

  @Post()
  @Header('Cache-Control', 'no-store')
  create(@Req() req: AccountRequest, @Body() body: Record<string, unknown>) {
    return this.keys.create(req.user.id, body)
  }

  @Patch(':id')
  @Header('Cache-Control', 'no-store')
  update(
    @Req() req: AccountRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.keys.update(req.user.id, id, body)
  }

  @Post(':id/regenerate')
  @Header('Cache-Control', 'no-store')
  regenerate(@Req() req: AccountRequest, @Param('id') id: string) {
    return this.keys.regenerate(req.user.id, id)
  }

  @Delete(':id')
  @Header('Cache-Control', 'no-store')
  delete(@Req() req: AccountRequest, @Param('id') id: string) {
    return this.keys.delete(req.user.id, id)
  }
}
