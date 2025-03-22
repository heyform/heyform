/**
 * @program: heyform-integrations
 * @description: Telegram
 * @author: Mufeng
 * @date: 2021-06-10 13:21
 **/

import * as assert from 'assert'
import got from 'got'

const BASE_URI_VALIDATE = 'https://api.telegram.org/bot'

export class Telegram {
  private webhookUrl!: string

  constructor(webhookUrl: string) {
    assert(
      webhookUrl.startsWith(BASE_URI_VALIDATE),
      'Invalid telegram bot webhook url'
    )
    this.webhookUrl = webhookUrl
  }

  static init(webhookUrl: string) {
    return new Telegram(webhookUrl)
  }

  /**
   * Send message to telegram chat group
   *
   * Response example
   * {
   *   "ok": true,
   *   "result": {
   *   "message_id": 68,
   *     "from": {
   *     "id": 7312139335,
   *     "is_bot": true,
   *     "first_name": "HeyForm Bot",
   *     "username": "HeyForm_bot"
   *   },
   *   "chat": {
   *     "id": -873826285,
   *     "title": "Group 01",
   *     "type": "group",
   *     "all_members_are_administrators": true
   *   },
   *   "date": 1605671766,
   *   "text": "hello world"
   * }
   */
  async sendText(chatId: string, text: string) {
    return this.request({
      chat_id: chatId,
      text
    })
  }

  request(data: Record<string, any>): Promise<any> {
    return got
      .post(this.webhookUrl, {
        json: data,
        timeout: 30_000
      })
      .json()
  }
}
