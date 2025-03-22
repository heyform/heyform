/**
 * @program: heyform-integrations
 * @description: Google Sheets
 * @author: Mufeng
 * @date: 2021-06-09 15:34
 **/

import { helper } from '@heyform-inc/utils'
const { isValid } = helper
import { google, sheets_v4 } from 'googleapis'
import { GoogleOAuth, GoogleOAuthConfig } from './googleoauth'
import { mapToObject } from './utils'

export class GoogleSheets extends GoogleOAuth {
  // static override init(config: GoogleOAuthConfig): GoogleSheets {
  static init(config: GoogleOAuthConfig): GoogleSheets {
    // 为了兼容 MongoDB 中的 Map 类型
    // 将 config 中的 Map 转成 Object
    config.tokens = mapToObject(config.tokens)

    const instance = new GoogleSheets(config)

    if (isValid(config.tokens)) {
      instance.setCredentials(config.tokens!)
    }

    return instance
  }

  // Google Sheets 存放在 Google Drive 中，可以通过一下方式获取
  //
  // Google.Drive.files({
  //   driveId: [DriveID],
  //   q: "mimeType = 'application/vnd.google-apps.spreadsheet'",
  //   fields: 'nextPageToken, files(id, name, webViewLink, createdTime)'
  // })
  //
  // async files() {}

  async worksheets(spreadsheetId: string): Promise<sheets_v4.Schema$Sheet[]> {
    const result = await this.client().spreadsheets.get({
      spreadsheetId,
      includeGridData: false
    })
    return result.data.sheets || []
  }

  async values(spreadsheetId: string, range?: string) {
    const result = await this.client().spreadsheets.values.get({
      spreadsheetId,
      range
    })
    return result.data
  }

  async append(
    spreadsheetId: string,
    range: string,
    values: Array<Array<string | number | boolean>>
  ): Promise<sheets_v4.Schema$AppendValuesResponse> {
    const result = await this.client().spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values
      }
    })
    return result.data
  }

  private client() {
    return google.sheets({
      version: 'v4',
      auth: this.oAuth2Client as any
    })
  }
}
