import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import 'reflect-metadata'

import { defaultLocales, formatLocale } from '../social-login/utils'

export function lang(req: any, headerName: string, whiteList: string[]): string {
  const lang = req.get(headerName)
  return formatLocale(lang, whiteList)
}

export const GqlLangDecorator = (headerName: string, whiteList: string[]) => {
  return createParamDecorator((_, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context)
    const { req } = ctx.getContext()
    return lang(req, headerName, whiteList)
  })
}

export const GqlLang = createParamDecorator((_, context: ExecutionContext): string => {
  const ctx = GqlExecutionContext.create(context)
  const { req } = ctx.getContext()
  return lang(req, 'user-lang', defaultLocales)
})

export const HttpLang = createParamDecorator((_, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest()
  return lang(req, 'user-lang', defaultLocales)
})
