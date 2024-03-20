import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

export const GraphqlRequest = createParamDecorator((_: any, context: ExecutionContext) => {
  const ctx = GqlExecutionContext.create(context)
  const { req } = ctx.getContext()
  return req
})

export const GraphqlResponse = createParamDecorator((_: any, context: ExecutionContext) => {
  const ctx = GqlExecutionContext.create(context)
  const { req } = ctx.getContext()
  return req.res
})
