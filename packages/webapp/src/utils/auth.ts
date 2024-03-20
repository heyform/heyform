import { helper, nanoid } from '@heyform-inc/utils'
import type { CookieAttributes } from 'js-cookie'
import cookies from 'js-cookie'
import store from 'store2'

import { COOKIE_DOMAIN } from '@/consts'

export const browserIdKey = 'HEYFORM_BROWSER_ID'
export const loggedInKey = 'HEYFORM_LOGGED_IN'

const cookieOptions: CookieAttributes = {
  expires: 365,
  sameSite: 'strict',
  domain: COOKIE_DOMAIN,
  secure: import.meta.env.NODE_ENV === 'production'
}

export function setCookie(key: string, value: string, options = cookieOptions) {
  cookies.set(key, value, options)
}

export function getCookie(key: string) {
  return cookies.get(key)
}

export function getAuthState() {
  const value = getCookie(loggedInKey)
  return helper.isValid(value)
}

export function clearAuthState() {
  // Clear local storage
  Object.keys(localStorage).forEach(key => {
    if (key !== browserIdKey) {
      store.remove(key)
    }
  })

  // Clear logged in cookie
  cookies.remove(loggedInKey, {
    path: '/',
    domain: COOKIE_DOMAIN
  })
}

export function getBrowserId() {
  const storage = store.get(browserIdKey)
  const cookie = getCookie(browserIdKey)

  if (helper.isValid(storage)) {
    if (!helper.isEqual(storage, cookie)) {
      setCookie(browserIdKey, storage)
    }
    return storage
  } else if (helper.isValid(cookie)) {
    store.set(browserIdKey, cookie)
    return cookie
  }
}

export function setBrowserId() {
  const browserId = nanoid(12)

  setCookie(browserIdKey, browserId)
  store.set(browserIdKey, browserId)
}
