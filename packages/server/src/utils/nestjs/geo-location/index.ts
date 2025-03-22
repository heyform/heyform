import { helper } from '@heyform-inc/utils'
import * as geoip from 'geoip-lite'
import { PlatformType } from '../user-agent'

export interface GeoLocation {
  country: string
  region: string
  city: string
}

export function geoLocation(ip: string): GeoLocation {
  const geo = geoip.lookup(ip)
  const country = helper.isValid(geo?.country)
    ? geo!.country
    : PlatformType.OTHER
  const region = helper.isValid(geo?.region) ? geo!.region : PlatformType.OTHER
  const city = helper.isValid(geo?.city) ? geo!.city : PlatformType.OTHER

  return {
    country,
    region,
    city
  }
}
