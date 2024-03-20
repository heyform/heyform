import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import 'reflect-metadata'

export const GqlBrowserId = createParamDecorator((_: any, context: ExecutionContext): string => {
  const ctx = GqlExecutionContext.create(context)
  const { req } = ctx.getContext()
  return req.get('x-browser-Id')
})

export const HttpBrowserId = createParamDecorator((_: any, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest()
  return req.get('x-browser-Id')
})
