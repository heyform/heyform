/**
 * @program: heyform-integrations
 * @description: Google Drive
 * @author: Mufeng
 * @date: 2021-06-09 15:35
 **/

import { helper, mime } from '@heyform-inc/utils'
const isValid = helper.isValid
import { drive_v3, google } from 'googleapis'
import got from 'got'
import { GoogleOAuth, GoogleOAuthConfig } from './googleoauth'
import { mapToObject } from './utils'

export class GoogleDrive extends GoogleOAuth {
  // static override init(config: GoogleOAuthConfig): GoogleDrive {
  static init(config: GoogleOAuthConfig): GoogleDrive {
    // 为了兼容 MongoDB 中的 Map 类型
    // 将 config 中的 Map 转成 Object
    config.tokens = mapToObject(config.tokens)

    const instance = new GoogleDrive(config)

    if (isValid(config.tokens)) {
      instance.setCredentials(config.tokens!)
    }

    return instance
  }

  async drives(pageSize = 100): Promise<drive_v3.Schema$Drive[]> {
    const client = this.client()
    const defaultDrive: drive_v3.Schema$Drive = {
      id: '',
      name: 'My Google Drive'
    }
    const result = await client.drives.list({
      pageSize
    })
    return [defaultDrive, ...(result.data.drives || [])]
  }

  async folders(options?: drive_v3.Params$Resource$Files$List) {
    const custom = {
      q: "mimeType = 'application/vnd.google-apps.folder'",
      fields: 'nextPageToken, files(id, name, webViewLink, createdTime)',
      pageSize: 100
    }

    return this.files({
      ...custom,
      ...options
    })
  }

  async spreadsheets(options?: drive_v3.Params$Resource$Files$List) {
    const custom = {
      q: "mimeType = 'application/vnd.google-apps.spreadsheet'",
      fields: 'nextPageToken, files(id, name, webViewLink, createdTime)',
      pageSize: 1000
    }
    return this.files({
      ...custom,
      ...options
    })
  }

  async files(
    options: drive_v3.Params$Resource$Files$List
  ): Promise<drive_v3.Schema$FileList> {
    const result = await this.client().files.list(options)
    return result.data
  }

  async upload(folderId: string, fileUrl: string, fileName: string) {
    const mimeType = mime(fileName) || 'application/octet-stream'
    const result = await this.client().files.create({
      requestBody: {
        name: fileName,
        mimeType,
        parents: [folderId]
      },
      media: {
        body: got.stream(fileUrl)
      }
    })
    return result.data
  }

  private client() {
    return google.drive({
      version: 'v3',
      auth: this.oAuth2Client as any
    })
  }
}
