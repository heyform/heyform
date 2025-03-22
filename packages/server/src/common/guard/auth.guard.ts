import { COOKIE_USERID_NAME } from '@config'
import { SESSION_MAX_AGE } from '@environments'
import { helper, hs, timestamp } from '@heyform-inc/utils'
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { AuthService, UserService } from '@service'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context)
    let { req } = ctx.getContext()

    if (helper.isEmpty(req)) {
      req = context.switchToHttp().getRequest()
    }

    const deviceId = req.get('x-device-id') || req.cookies[COOKIE_USERID_NAME]
    const user = this.authService.getSession(req)

    if (helper.isValid(user)) {
      if (deviceId !== user.deviceId) {
        throw new ForbiddenException('Forbidden request error')
      }

      const isExpired = await this.authService.isExpired(user.id, user.deviceId)

      if (!isExpired) {
        const detail = await this.userService.findById(user.id)

        if (helper.isValid(detail)) {
          if (detail.isBlocked) {
            throw new UnauthorizedException('Your account has been blocked')
          }
          req.user = detail

          // Renew session at maxAge/2
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
