/**
 * @program: heyform-integrations
 * @description: Lark
 * @link: https://www.larksuite.com/hc/en-US/articles/360048487736-Bot-Use-bots-in-groups#1.1.2%20Plain%20text%20messages
 * @author: Mufeng
 * @date: 2021-06-10 13:38
 **/

import * as assert from 'assert'
import got from 'got'
import { RequestError } from './requesterror'

const BASE_URI_VALIDATE = 'https://open.feishu.cn/open-apis/bot/'

export interface LarkResponse {
  Extra: any
  StatusCode: number
  StatusMessage: string
}

export class Lark {
  private webhookUrl!: string

  constructor(webhookUrl: string) {
    assert(
      webhookUrl.startsWith(BASE_URI_VALIDATE),
      'Invalid lark bot webhook url'
    )
    this.webhookUrl = webhookUrl
  }

  static init(webhookUrl: string) {
    return new Lark(webhookUrl)
  }

  async sendText(text: string) {
    return this.request({
      msg_type: 'text',
      content: {
        text
      }
    })
  }

  sendPost(post: any) {
    return this.request({
      msg_type: 'post',
      content: {
        post
      }
    })
  }

  sendInteractive(card: any) {
    return this.request({
      msg_type: 'interactive',
      content: {
        card
      }
    })
  }

  async request(data: Record<string, any>): Promise<LarkResponse> {
    const result: any = await got
      .post(this.webhookUrl, {
        json: data,
        timeout: 30_000
      })
      .json()

    if (result.StatusCode !== 0) {
      throw new RequestError(result)
    }

    return result
  }
}
