/**
 * @program: heyform-integrations
 * @description: Legacy Slack (only slack users private app)
 * @author: Mufeng
 * @date: 2021-06-10 13:37
 **/

import * as assert from 'assert'
import got from 'got'

const BASE_URI_VALIDATE = 'https://hooks.slack.com/services/'

export class LegacySlack {
  private webhookUrl!: string

  constructor(webhookUrl: string) {
    assert(
      webhookUrl.startsWith(BASE_URI_VALIDATE),
      'Invalid slack webhook url'
    )
    this.webhookUrl = webhookUrl
  }

  static init(webhookUrl: string) {
    return new LegacySlack(webhookUrl)
  }

  async sendText(text: string) {
    return this.request({
      text
    })
  }

  request(data: Record<string, any>): Promise<any> {
    return got
      .post(this.webhookUrl, {
        json: data,
        timeout: 30_000
      })
      .text()
  }
}
