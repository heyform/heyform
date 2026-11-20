import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'

import { COOKIE_DEVICE_ID_NAME } from '@config'
import { SESSION_MAX_AGE } from '@environments'
import { helper, hs, timestamp } from '@heyform-inc/utils'
import { GqlExecutionContext } from '@nestjs/graphql'
import { AuthService, UserService } from '@service'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req =
      context.getType() === 'http'
        ? context.switchToHttp().getRequest()
        : GqlExecutionContext.create(context).getContext().req

    const deviceId = req.get('x-device-id') || req.cookies[COOKIE_DEVICE_ID_NAME]
    const user = this.authService.getSession(req)

    if (helper.isValid(user)) {
      if (deviceId !== user.deviceId) {
        throw new ForbiddenException('Forbidden request error')
      }

      const isExpired = await this.authService.isExpired(user.id, user.deviceId)

      if (!isExpired) {
        const detail = await this.userService.findById(user.id)

        if (helper.isValid(detail)) {
          req.user = detail

          const now = timestamp()
          const expire = hs(SESSION_MAX_AGE)

          if (now - Number(user.loginAt) > expire / 2) {
            await this.authService.renew(user.id, user.deviceId)
            this.authService.setSession(req.res, {
              ...user,
              loginAt: now
            })
          }

          return true
        }
      }
    }

    throw new UnauthorizedException('Unauthorized')
  }
}
