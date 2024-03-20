import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

import { helper } from '@heyform-inc/utils'

import { UserModel } from '@model'

/**
 * Get req.team attached to AuthGuard (guard/permission.guard.ts)
 */
export const Team = createParamDecorator(
  (_: any, context: ExecutionContext): UserModel => {
    const ctx = GqlExecutionContext.create(context)
    let { req } = ctx.getContext()

    if (helper.isEmpty(req)) {
      req = context.switchToHttp().getRequest()
    }

    return req.team
  }
)
