/**
 * @program: heyform-integrations
 * @description: Utils
 * @author: Mufeng
 * @date: 2021-06-08 13:14
 **/

import { helper } from '@heyform-inc/utils'
const { isEmpty, isMap, isValid } = helper
import { createHash } from 'crypto'
import isEmail from 'validator/lib/isEmail'

export function md5(data: string): string {
  return createHash('md5').update(data).digest('hex')
}

export function isEmailAddress(emailAddress: string): boolean {
  return isValid(emailAddress) && isEmail(emailAddress)
}

export function mapToObject<T = any>(mapLike: any): T {
  if (isEmpty(mapLike)) {
    return {} as T
  }

  // @ts-ignore
  return isMap(mapLike) ? Object.fromEntries(mapLike) as T : mapLike
}

export function base64Encode(text: string): string {
  return Buffer.from(text).toString('base64')
}
