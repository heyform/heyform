import { helper } from '@heyform-inc/utils'
const { isValid } = helper
import * as WhichBrowser from 'which-browser'

export enum PlatformType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  OTHER = 'other'
}

export interface UserAgent {
  browser: {
    name: string
    version: string
  }
  os: {
    name: string
    version: string
  }
  platform: {
    type: string
    model: string
    manufacturer: string
  }
}

export function parseUserAgent(userAgent: string): UserAgent {
  const { browser, device, os } = new (WhichBrowser as any)(userAgent)

  return {
    browser: {
      name: isValid(browser.name) ? browser.name : PlatformType.OTHER,
      version: isValid(browser.version?.value)
        ? browser.version?.value
        : PlatformType.OTHER
    },
    os: {
      name: isValid(os.name) ? os.name : PlatformType.OTHER,
      version: isValid(os.version?.value)
        ? os.version?.value
        : PlatformType.OTHER
    },
    platform: {
      type: Object.values(PlatformType).includes(device.type)
        ? device.type
        : PlatformType.OTHER,
      model: isValid(device.model) ? device.model : PlatformType.OTHER,
      manufacturer: device.manufacturer
    }
  }
}
