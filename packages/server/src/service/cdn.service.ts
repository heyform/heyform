import {
  BUNNY_API_ACCESS_KEY,
  BUNNY_API_URL,
  BUNNY_TOKEN_KEY,
  QINIU_CALLBACK_URL
} from '@environments'
import { Injectable } from '@nestjs/common'
import { nanoid, timestamp } from '@heyform-inc/utils'
import got from 'got'
import { aesEncryptObject } from '@heyforms/nestjs'

@Injectable()
export class CdnService {
  public async uploadToCdn(filename: string, stream: any): Promise<string> {
    const key = nanoid() + '_' + filename

    await got.put(BUNNY_API_URL + filename, {
      body: stream,
      headers: {
        AccessKey: BUNNY_API_ACCESS_KEY
      }
    })

    return key
  }

  public publicDownloadUrl(urlPrefix: string, key: string): string {
    return this.privateDownloadUrl(urlPrefix, key)
  }

  public privateDownloadUrl(urlPrefix: string, key: string): string {
    return [urlPrefix.replace(/\/+$/, ''), key].join('/')
  }

  uploadToken(mimeLimit: string[], sizeLimit: number, endUser: string): string {
    const json = {
      endUser,
      callbackUrl: QINIU_CALLBACK_URL,
      mimeLimit: mimeLimit.join(';'),
      fsizeLimit: sizeLimit,
      // 有效期 15m
      expiresAt: timestamp() + 900
    }

    return aesEncryptObject(json, BUNNY_TOKEN_KEY)
  }
}
