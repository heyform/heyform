import {
  COOKIE_DOMAIN,
  COOKIE_MAX_AGE,
  NODE_ENV,
  SESSION_MAX_AGE
} from '@environments'
import { ms } from '@heyform-inc/utils'
import { CookieOptions } from 'express'

const production = NODE_ENV === 'production'

const commonOptions = {
  domain: COOKIE_DOMAIN,
  sameSite: 'lax',
  signed: false,
  secure: production
}

export const COOKIE_SESSION_NAME = 'HEYFORM_SESSION'
export const COOKIE_LOGIN_IN_NAME = 'HEYFORM_LOGGED_IN'
export const COOKIE_USERID_NAME = 'HEYFORM_USER_ID'
export const COOKIE_UTM_SOURCE_NAME = 'HEYFORM_UTM_SOURCE'

export function CookieOptionsFactory(options?: CookieOptions): CookieOptions {
  return {
    maxAge: ms(COOKIE_MAX_AGE),
    ...commonOptions,
    ...options
  } as any
}

export function SessionOptionsFactory(options?: CookieOptions): CookieOptions {
  return {
    maxAge: ms(SESSION_MAX_AGE),
    httpOnly: true,
    ...commonOptions,
    ...options
  } as any
}
