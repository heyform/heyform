import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

import { helper } from '@heyform-inc/utils'

import { COOKIE_BROWSER_ID_NAME } from '@config'

@Injectable()
export class BrowserIdGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context)
    let { req } = ctx.getContext()

    if (helper.isEmpty(req)) {
      req = context.switchToHttp().getRequest()
    }

    const browserId = req.get('x-browser-Id') || req.cookies[COOKIE_BROWSER_ID_NAME]

    if (helper.isEmpty(browserId)) {
      throw new ForbiddenException('Forbidden request error')
    }

    return true
  }
}
