import { AppInternalTypeEnum, AppModel, AppSchema } from '@model'
import { Connection } from 'mongoose'

export default {
  async up(mongoose: Connection) {
    const model = mongoose.model<AppModel>(AppModel.name, AppSchema)
    return await model.insertMany([
      {
        internalType: AppInternalTypeEnum.OPEN_APP_OPTIONS,
        internalKind: 'email',
        uniqueId: 'email',
        category: 'reporting',
        name: 'Email Notification',
        description: 'Get notified by email when a new submission is received.',
        avatar: 'https://hash.b-cdn.net/heyform/email.png',
        attributes: {
          /**
           * https://github.com/yiminghe/async-validator#type
           */
          email: 'email'
        },
        status: 1
      },
      {
        internalType: AppInternalTypeEnum.THIRD_PARTY_OPTIONS,
        internalKind: 'webhook',
        uniqueId: 'lark',
        category: 'reporting',
        name: 'Lark Suite',
        description:
          'Get notifications by Lark bots when a new submission is received.',
        avatar: 'https://hash.b-cdn.net/heyform/lark.png',
        attributes: {
          /**
           * https://github.com/yiminghe/async-validator#type
           */
          webhook: 'url'
        },
        status: 1
      },
      {
        internalType: AppInternalTypeEnum.THIRD_PARTY_OPTIONS,
        internalKind: 'webhook',
        uniqueId: 'slack',
        category: 'reporting',
        name: 'Slack',
        description:
          'Get notifications in Slack when a new submission is received.',
        avatar: 'https://hash.b-cdn.net/heyform/slack.png',
        attributes: {
          /**
           * https://github.com/yiminghe/async-validator#type
           */
          webhook: 'url'
        },
        status: 1
      },
      {
        internalType: AppInternalTypeEnum.THIRD_PARTY_OPTIONS,
        internalKind: 'webhook',
        uniqueId: 'dingtalk',
        category: 'reporting',
        name: 'DingTalk',
        description:
          'Get notifications in DingTalk when a new submission is received.',
        avatar: 'https://hash.b-cdn.net/heyform/dingtalk.png',
        attributes: {
          /**
           * https://github.com/yiminghe/async-validator#type
           */
          webhook: 'url'
        },
        status: 1
      },
      {
        internalType: AppInternalTypeEnum.THIRD_PARTY_OPTIONS,
        internalKind: 'webhook',
        uniqueId: 'weixinwork',
        category: 'reporting',
        name: 'WeCom',
        description:
          'Get notifications in WeCom when a new submission is received.',
        avatar: 'https://hash.b-cdn.net/heyform/weixinwork.png',
        attributes: {
          /**
           * https://github.com/yiminghe/async-validator#type
           */
          webhook: 'url'
        },
        status: 1
      },
      {
        internalType: AppInternalTypeEnum.THIRD_PARTY_OPTIONS,
        internalKind: 'webhook',
        uniqueId: 'telegram',
        category: 'reporting',
        name: 'Telegram',
        description:
          'Get notifications by Telegram bots when a new submission is received.',
        avatar: 'https://hash.b-cdn.net/heyform/telegram.png',
        attributes: {
          /**
           * https://github.com/yiminghe/async-validator#type
           */
          chat_id: 'string'
        },
        status: 1
      },
      {
        internalType: AppInternalTypeEnum.OPEN_APP_OAUTH,
        internalKind: 'open_app_oauth',
        uniqueId: 'zapier',
        clientId: 's5jgFLiwebhpmz31HuXT',
        clientSecret: 'E1gXuIJSlzc5R6ys0xNV',
        category: 'reporting',
        name: 'Zapier',
        homepage: 'https://zapier.com/apps/heyform/integrations',
        description: 'Integrate with over 1500+ apps with Zapier',
        avatar: 'https://hash.b-cdn.net/heyform/zapier.png',
        attributes: {},
        config: {
          redirectUri: 'https://zapier.com/'
        },
        status: 1
      }
    ])
  }
}
