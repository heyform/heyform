import { helper } from '@heyform-inc/utils'
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

@Injectable()
export class EndpointAnonymousIdGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context)
    const { req } = ctx.getContext()
    const anonymousId = req.get('x-anonymous-id')

    if (helper.isEmpty(anonymousId)) {
      throw new ForbiddenException('Forbidden request error')
    }

    return true
  }
}
