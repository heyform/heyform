import { Auth, FormGuard, Team, User } from '@decorator'
import { ChatDto } from '@dto'
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res
} from '@nestjs/common'
import { OpenAIService, RedisService } from '@service'
import { Response } from 'nestjs-sse'
import { helper, parseJson } from '@heyform-inc/utils'
import { TeamModel, UserModel } from '@model'
import * as template from 'art-template'
import { CHAT_PROMPT, LANGUAGES } from '@config'

@Controller()
@Auth()
export class ChatController {
  constructor(
    private readonly redisService: RedisService,
    private readonly openAIService: OpenAIService
  ) {}

  @Post('/api/chat')
  @FormGuard()
  async chat(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Body() input: ChatDto,
    @Res() res: Response
  ) {
    if (!team.plan.aiForm) {
      throw new BadRequestException('Upgrade your plan to chat with AI')
    }

    try {
      await this.redisService.throttler(`chat:${user.id}`, 60, '1h')

      const result = await this.openAIService.chatCompletionStream({
        messages: [
          {
            role: 'user',
            content: template.render(CHAT_PROMPT, {
              prompt: input.prompt,
              language: LANGUAGES[input.language]
            })
          }
        ]
      })

      const stream = result.data as any

      const prefixRegex = /^data:\s+/
      let prevMessage: string | null = null

      stream.on('data', (data: unknown) => {
        const lines = data.toString().split('\n').filter(helper.isValid)

        for (const row of lines) {
          let message = row.replace(prefixRegex, '')

          if (!prefixRegex.test(row) && prevMessage) {
            message = prevMessage + message
          }

          if (message === '[DONE]') {
            return this.complete(res)
          }

          try {
            const json = JSON.parse(message)
            const choice = json.choices[0].delta

            if (!choice.finish_reason && choice.content) {
              this.send(res, choice.content)
            }

            prevMessage = null
          } catch {
            prevMessage = message
          }
        }
      })

      stream.on('error', (err: any) => {
        this.exit(res, err.message)
      })

      stream.on('end', () => {
        this.complete(res)
      })
    } catch (err) {
      let message = err.message

      if (err.response && err.response.data) {
        const json = await this._getSteamData(err.response.data)

        if (json?.error?.message) {
          message = json.error.message
        }
      }

      this.exit(res, message)
    }
  }

  private async _getSteamData(steam: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let data = ''

      steam.on('data', chunk => {
        data += chunk
      })

      steam.on('end', () => {
        resolve(parseJson(data))
      })

      steam.on('error', err => {
        reject(err)
      })
    })
  }

  private send(res: Response, message: string) {
    res.sse(`data: ${message}\n\n`)
  }

  private complete(res: Response) {
    res.end()
  }

  private exit(res: Response, message: string) {
    if (message) {
      this.send(res, `[ERROR] ${message}`)
    }

    this.complete(res)
  }
}
