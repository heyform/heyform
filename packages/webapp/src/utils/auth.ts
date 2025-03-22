import { helper, nanoid } from '@heyform-inc/utils'
import cookies from 'js-cookie'
import store from 'store2'

import { COOKIE_OPTIONS, DEVICEID_COOKIE_NAME, LOGGED_COOKIE_NAME } from '@/consts'

export function setCookie(key: string, value: string, options = COOKIE_OPTIONS) {
  cookies.set(key, value, options)
}

export function getCookie(key: string) {
  return cookies.get(key)
}

export function clearCookie(key: string) {
  setCookie(key, '', {
    expires: 0
  })
}

export function getAuthState() {
  const value = getCookie(LOGGED_COOKIE_NAME)
  return helper.isTrue(value)
}

export function clearAuthState() {
  // Clear local storage
  Object.keys(localStorage).forEach(key => {
    if (key !== DEVICEID_COOKIE_NAME) {
      store.remove(key)
    }
  })

  // Clear logged in cookie
  clearCookie(LOGGED_COOKIE_NAME)
}

export function getDeviceId() {
  const storage = store.get(DEVICEID_COOKIE_NAME)
  const cookie = getCookie(DEVICEID_COOKIE_NAME)

  if (helper.isValid(storage)) {
    if (!helper.isEqual(storage, cookie)) {
      setCookie(DEVICEID_COOKIE_NAME, storage)
    }

    return storage
  } else if (helper.isValid(cookie)) {
    store.set(DEVICEID_COOKIE_NAME, cookie)
    return cookie
  }
}

export function setDeviceId() {
  const deviceId = nanoid(12)

  setCookie(DEVICEID_COOKIE_NAME, deviceId)
  store.set(DEVICEID_COOKIE_NAME, deviceId)
}
