import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import 'reflect-metadata'

import { UserAgent as UserAgentInterface, parseUserAgent } from '../user-agent'

export const GqlUserAgent = createParamDecorator(
  (_: any, context: ExecutionContext): UserAgentInterface => {
    const ctx = GqlExecutionContext.create(context)
    const { req } = ctx.getContext()
    return parseUserAgent(req.get('user-agent'))
  }
)

export const HttpUserAgent = createParamDecorator(
  (_: any, ctx: ExecutionContext): UserAgentInterface => {
    const req = ctx.switchToHttp().getRequest()
    return parseUserAgent(req.get('user-agent'))
  }
)
