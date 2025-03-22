import * as lark from '@larksuiteoapi/node-sdk'
import { Controller, HttpCode, Logger, Post, Req, Res } from '@nestjs/common'
import { LRU, LRUKeyType, LRUValueType } from '@nily/lru'
import { dayjs, helper } from '@heyform-inc/utils'
const { isEmpty, isValidArray } = helper
import { larkBotConfig } from '@config'
import { FormService, PlanService, TeamService, UserService } from '@service'
import { PlanGradeEnum } from '@model'

class LarkbotLogger extends Logger {
  public info(...msg: any[]) {
    this.log(msg[0])
  }

  public trace(...msg: any[]) {
    this.error(msg[0])
  }
}

@Controller()
export class LarkbotController {
  private readonly larkClient: lark.Client
  private readonly eventDispatcher: lark.EventDispatcher
  private readonly lru: LRU
  private readonly logger: LarkbotLogger

  constructor(
    private readonly teamService: TeamService,
    private readonly formService: FormService,
    private readonly planService: PlanService,
    private readonly userService: UserService
  ) {
    this.lru = new LRU({
      capacity: 1000,
      expires: dayjs().add(1, 'hour').unix(),
      cache: new Map<LRUKeyType, LRUValueType<boolean>>()
    })
    this.logger = new LarkbotLogger('Lark')

    this.larkClient = new lark.Client({
      appId: larkBotConfig.appId,
      appSecret: larkBotConfig.appSecret,
      appType: lark.AppType.SelfBuild,
      domain: lark.Domain.Feishu,
      logger: this.logger
    })

    this.eventDispatcher = new lark.EventDispatcher({
      encryptKey: larkBotConfig.encryptKey
    }).register({
      'im.message.receive_v1': async data => {
        const chatId = data.message.chat_id
        const messageId = data.message.message_id

        // Don't handle duplicate message
        if (this.lru.get(messageId)) {
          this.logger.log(`Find exists message: ${messageId}`)

          return {
            status: 'success'
          }
        }

        if (isValidArray(data.message.mentions)) {
          const mentionBot = data.message.mentions.find(
            m => m.name === 'HeyForm'
          )

          if (mentionBot) {
            const content = JSON.parse(data.message.content)
            const commands = content.text.replace(/^[^/]+\//, '').split(/\s+/)

            // Add message id to cache
            this.lru.put(messageId, true)

            switch (commands[0]) {
              case 'report':
                return this.report(chatId)

              case 'form':
                return this.form(chatId, commands[1])

              case 'suspend':
                return this.suspend(chatId, commands[1])

              case 'workspace':
                return this.workspace(chatId, commands[1])

              case 'list':
                return this.list(chatId, commands[1])

              default:
                return this.help(chatId)
            }
          }
        }

        return {
          status: 'success'
        }
      }
    })
  }

  @Post('/internal-api/larkbot')
  @HttpCode(200)
  async post(@Req() req: any, @Res() res: any) {
    await lark.adaptExpress(this.eventDispatcher, {
      logger: this.logger,
      autoChallenge: true
    })(req, res)
  }

  private async help(chatId) {
    return this.sendPost(chatId, '🛟 HeyForm Commands', [
      [
        {
          tag: 'text',
          text: '/help - List all the commands'
        }
      ],
      [
        {
          tag: 'text',
          text: '/report - List the number of users and the number of forms'
        }
      ],
      [
        {
          tag: 'text',
          text: '/list xxx@example.com - List the forms of a user'
        }
      ],
      [
        {
          tag: 'text',
          text: '/workspace xxx@example.com - List the workspaces of a user'
        }
      ],
      [
        {
          tag: 'text',
          text: '/form [form_id] - Fetch form and user info'
        }
      ],
      [
        {
          tag: 'text',
          text: '/suspend [form_id] - Suspend an abusive form'
        }
      ]
    ])
  }

  private async report(chatId: string) {
    const [userCount, formCount, _plans, prices] = await Promise.all([
      this.userService._internalCountAll(),
      this.formService._internalCountAll(),
      this.planService.findAll(),
      this.planService.findPlanPricesBy({})
    ])

    const plans = _plans.filter(p => p.grade > PlanGradeEnum.FREE)
    const teams = await this.teamService._internalFindAll(plans.map(p => p.id))

    const mmr = teams.reduce((prev, next) => {
      const price = prices.find(p => p.planId === next.subscription.planId)

      if (price) {
        return prev + price.price
      }

      return prev
    }, 0)

    return this.sendPost(chatId, '📢 Report', [
      [
        {
          tag: 'text',
          text: `Users: ${userCount}`
        }
      ],
      [
        {
          tag: 'text',
          text: `Forms: ${formCount}`
        }
      ],
      [
        {
          tag: 'text',
          text: `\n`
        }
      ],
      [
        {
          tag: 'text',
          text: `Subscribers: ${teams.length}`
        }
      ],
      [
        {
          tag: 'text',
          text: `MMR: $${mmr}`
        }
      ]
    ])
  }

  private async form(chatId: string, formId: string) {
    const form = await this.formService.findById(formId)

    if (!form) {
      return this.sendText(chatId, `🎈 Form (${formId}) is not exists`)
    }

    const team = await this.teamService.findById(form.teamId)

    if (!team) {
      return this.sendText(chatId, `🎈 Form (${formId}) is not exists`)
    }

    const user = await this.userService.findById(team.ownerId)

    if (!user) {
      return this.sendText(chatId, `🎈 Form (${formId}) is not exists`)
    }

    return this.sendPost(chatId, '📢 Form', [
      [
        {
          tag: 'text',
          text: `Form: ${form.name}`
        }
      ],
      [
        {
          tag: 'text',
          text: `User: ${user.email}`
        }
      ]
    ])
  }

  private async suspend(chatId: string, formId: string) {
    await this.formService.update(formId, {
      suspended: true
    })

    return this.sendPost(chatId, '📢 Suspend form', [
      [
        {
          tag: 'text',
          text: `Form (${formId}) has been suspended`
        }
      ]
    ])
  }

  private async workspace(chatId: string, email: string) {
    const matches = email.match(/^\[(.+)]\(mailto:.+\)$/)

    if (matches) {
      email = matches[1]
    }

    const user = await this.userService.findByEmail(email.toLowerCase())

    if (!user) {
      return this.sendText(chatId, `User ${email} not found`)
    }

    const [teams, plans] = await Promise.all([
      this.teamService.findAll(user.id),
      this.planService.findAll()
    ])

    if (isEmpty(teams)) {
      return this.sendText(chatId, `🎈 There is no workspaces for ${email}`)
    }

    const title = `💼 Workspaces for ${email}`
    let content: any[][] = []

    for (const team of teams) {
      const plan = plans.find(p => p.id === team.subscription?.planId)
      let text = team.name

      if (plan) {
        text += ` (${plan.name})`
      }

      content = [
        ...content,
        [
          {
            tag: 'text',
            text
          }
        ]
      ]
    }

    return this.sendPost(chatId, title, content)
  }

  private async list(chatId: string, email: string) {
    const matches = email.match(/^\[(.+)]\(mailto:.+\)$/)

    if (matches) {
      email = matches[1]
    }

    const user = await this.userService.findByEmail(email.toLowerCase())

    if (!user) {
      return this.sendText(chatId, `User ${email} not found`)
    }

    const teams = await this.teamService.findAll(user.id)

    const forms = await this.formService.findAllInTeam(teams.map(t => t.id))

    if (isEmpty(forms)) {
      return this.sendText(chatId, `🎈 There is no forms for ${email}`)
    }

    const title = `🖥 Forms for ${email}`
    let content: any[][] = []

    for (const form of forms) {
      content = [
        ...content,
        [
          {
            tag: 'text',
            text: form.name
          }
        ],
        [
          {
            tag: 'text',
            text: `heyform.net/f/${form.id}`
          }
        ],
        [
          {
            tag: 'text',
            text: ''
          }
        ]
      ]
    }

    return this.sendPost(chatId, title, content)
  }

  private async sendText(chatId: string, text: string) {
    return this.larkClient.im.message.create({
      params: {
        receive_id_type: 'chat_id'
      },
      data: {
        receive_id: chatId,
        content: JSON.stringify({
          text
        }),
        msg_type: 'text'
      }
    })
  }

  private async sendPost(chatId: string, title: string, content: any[][]) {
    return this.larkClient.im.message.create({
      params: {
        receive_id_type: 'chat_id'
      },
      data: {
        receive_id: chatId,
        content: JSON.stringify({
          en_us: {
            title: title,
            content: content
          }
        }),
        msg_type: 'post'
      }
    })
  }
}
