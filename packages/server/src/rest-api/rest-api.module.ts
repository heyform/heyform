import { CanActivate, Controller, ExecutionContext, Get, Injectable, Module, UnauthorizedException, UseGuards } from '@nestjs/common'
import { createHash, timingSafeEqual } from 'crypto'
import { Request } from 'express'

@Injectable()
export class RestApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Temporary bootstrap credential; database-backed scoped keys will replace this.
    const configured = process.env.HEYFORM_REST_API_KEY
    const authorization = context.switchToHttp().getRequest<Request>().headers.authorization
    const token = authorization?.match(/^Bearer ([^\s]+)$/i)?.[1]

    if (!configured || configured.length < 32 || !token) {
      throw new UnauthorizedException()
    }

    const digest = (value: string) => createHash('sha256').update(value).digest()
    if (!timingSafeEqual(digest(configured), digest(token))) {
      throw new UnauthorizedException()
    }

    return true
  }
}

@Controller('api/v1')
@UseGuards(RestApiKeyGuard)
export class RestApiController {
  @Get('health')
  health() {
    return { status: 'ok', version: 'v1' }
  }
}

@Module({
  controllers: [RestApiController],
  providers: [RestApiKeyGuard]
})
export class RestApiModule {}
