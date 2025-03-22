import { parseUserAgent, UserAgent } from '@heyforms/nestjs'
import { geoLocation, GeoLocation } from '@heyforms/nestjs'
import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { ip } from '@heyforms/nestjs'
import { lang } from '@heyforms/nestjs'

export interface ClientInfo {
  deviceId: string
  userAgent: UserAgent
  ip: string
  geoLocation: GeoLocation
  lang: string
}

export const GqlClient = createParamDecorator(
  (_: any, context: ExecutionContext): ClientInfo => {
    const ctx = GqlExecutionContext.create(context)
    const { req } = ctx.getContext()
    const cip = ip(req)

    return {
      deviceId: req.get('x-device-id'),
      userAgent: parseUserAgent(req.get('user-agent')),
      ip: cip,
      geoLocation: geoLocation(cip),
      lang: lang(req, 'x-user-lang', ['en', 'zh-cn'])
    }
  }
)

export const HttpClient = createParamDecorator(
  (_: any, ctx: ExecutionContext): ClientInfo => {
    const req = ctx.switchToHttp().getRequest()
    const cip = ip(req)

    return {
      deviceId: req.get('x-device-id'),
      userAgent: parseUserAgent(req.get('user-agent')),
      ip: cip,
      geoLocation: geoLocation(cip),
      lang: lang(req, 'x-user-lang', ['en', 'zh-cn'])
    }
  }
)
