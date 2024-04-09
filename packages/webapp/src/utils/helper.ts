import { FormTheme } from '@heyform-inc/shared-types-enums'
import { helper, qs, removeObjectNil } from '@heyform-inc/utils'
import isMobilePhone from 'validator/lib/isMobilePhone'

import { getTheme, getThemeStyle } from '@/components/formComponents'
import { STRIPE_PUBLISHABLE_KEY } from '@/consts'

export function urlBuilder(prefix: string, query: Record<string, any>): string {
  return prefix + '?' + qs.stringify(removeObjectNil(query), { encode: true })
}

const LOADED_SCRIPTS = new Set<string>()

export function loadScript(
  name: string,
  src: string,
  callback: (err?: Error) => void,
  attempts = 0
) {
  if (LOADED_SCRIPTS.has(src)) {
    return callback()
  }

  let script = document.getElementById(name) as HTMLScriptElement

  if (!script) {
    script = document.createElement('script')
    script.id = name
    script.src = src
    document.head.appendChild(script)
  }

  script.onload = () => {
    LOADED_SCRIPTS.add(src)
    callback()
  }

  script.onerror = () => {
    script.onload = null
    script.onerror = null
    document.head.removeChild(script)

    if (attempts >= 3) {
      return callback(new Error(`Failed to load script ${name}`))
    }

    attempts += 1

    setTimeout(() => {
      loadScript(name, src, callback, attempts)
    }, attempts * 50)
  }
}

export function redirectToStripeCheckout(sessionId: string) {
  return new Promise((resolve, reject) => {
    loadScript('stripe-v3', 'https://js.stripe.com/v3/', err => {
      if (err) {
        return reject(err)
      }

      const stripe = (window as any).Stripe(STRIPE_PUBLISHABLE_KEY)

      stripe.redirectToCheckout({
        sessionId
      })
      resolve(null)
    })
  })
}

export function insertStyle(id: string, style: string) {
  let styleElement = document.getElementById(id)

  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.id = id

    document.head.appendChild(styleElement)
  }

  styleElement.innerHTML = style
}

export function isPhoneNumber(arg: any): boolean {
  return helper.isValid(arg) && isMobilePhone(arg, 'zh-CN')
}

const SECOND = 1
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

export class SecondUtils {
  static parse(num: number, unit: string): number {
    if (unit === 'd') {
      return num * DAY
    }
    if (unit === 'h') {
      return num * HOUR
    }
    if (unit === 'm') {
      return num * MINUTE
    }
    return num * SECOND
  }

  static stringify(hs: number): [number, string] {
    if (hs >= DAY) {
      return [Math.round(hs / DAY), 'd']
    }
    if (hs >= HOUR) {
      return [Math.round(hs / HOUR), 'h']
    }
    if (hs >= MINUTE) {
      return [Math.round(hs / MINUTE), 'm']
    }
    return [hs, 's']
  }
}

export function insertThemeStyle(customTheme?: FormTheme) {
  const theme = getTheme(customTheme)
  let content = getThemeStyle(theme)

  let style = document.getElementById('heyform-theme')

  if (!style) {
    style = document.createElement('style')
    style.id = 'heyform-theme'

    document.head.appendChild(style)
  }

  if (customTheme?.customCSS) {
    content += customTheme!.customCSS
  }

  style.innerHTML = content
}

export function getFileUploadValue(v: any) {
  if (helper.isObject(v) && helper.isURL(v.url)) {
    return {
      filename: v.filename,
      url: urlBuilder(v.url, {
        attname: v.filename
      })
    }
  } else if (helper.isString(v) && helper.isURL(v)) {
    return {
      filename: 'Attachment',
      url: urlBuilder(v, {
        attname: 'Attachment'
      })
    }
  }
}

export function getUrlValue(v: any) {
  if (helper.isURL(v)) {
    return v
  }
}
