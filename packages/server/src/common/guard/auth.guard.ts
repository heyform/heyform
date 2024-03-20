import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

import { helper, hs, timestamp } from '@heyform-inc/utils'

import { COOKIE_BROWSER_ID_NAME } from '@config'
import { SESSION_MAX_AGE } from '@environments'
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

    const browserId = req.get('x-browser-Id') || req.cookies[COOKIE_BROWSER_ID_NAME]
    const user = this.authService.getSession(req)

    if (helper.isValid(user)) {
      if (browserId !== user.browserId) {
        throw new ForbiddenException('Forbidden request error')
      }

      const isExpired = await this.authService.isExpired(user.id, user.browserId)

      if (!isExpired) {
        const detail = await this.userService.findById(user.id)

        if (helper.isValid(detail)) {
          req.user = detail

          // Renew session at maxAge/2
          const now = timestamp()
          const expire = hs(SESSION_MAX_AGE)

          if (now - Number(user.loginAt) > expire / 2) {
            await this.authService.renew(user.id, user.browserId)
            await this.authService.setSession(req.res, {
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
