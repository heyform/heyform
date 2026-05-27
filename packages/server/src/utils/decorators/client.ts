import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import 'reflect-metadata'

import { GqlExecutionContext } from '@nestjs/graphql'

import { UserAgent, parseUserAgent } from '../user-agent'
import { ip } from './ip'
import { lang } from './lang'

export interface ClientInfo {
  deviceId: string
  userAgent: UserAgent
  ip: string
  lang: string
}

export const GqlClient = createParamDecorator((_: any, context: ExecutionContext): ClientInfo => {
  const ctx = GqlExecutionContext.create(context)
  const { req } = ctx.getContext()
  const cip = ip(req)

  return {
    deviceId: req.get('x-device-id'),
    userAgent: parseUserAgent(req.get('user-agent')),
    ip: cip,
    lang: lang(req, 'user-lang', ['en', 'pt-br', 'zh-cn'])
  }
})

export const HttpClient = createParamDecorator((_: any, ctx: ExecutionContext): ClientInfo => {
  const req = ctx.switchToHttp().getRequest()
  const cip = ip(req)

  return {
    deviceId: req.get('x-device-id'),
    userAgent: parseUserAgent(req.get('user-agent')),
    ip: cip,
    lang: lang(req, 'user-lang', ['en', 'pt-br', 'zh-cn'])
  }
})
