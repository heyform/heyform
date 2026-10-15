import { BadRequestException, Injectable } from '@nestjs/common'
import { OpenAI } from 'openai'

import { OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_GPT_MODEL } from '@environments'
import { helper } from '@heyform-inc/utils'

type ChatCompletionRequest = Omit<
  OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
  'model'
> & {
  model?: string
}

@Injectable()
export class OpenAIService {
  private client?: OpenAI

  private getClient(): OpenAI {
    if (helper.isEmpty(OPENAI_API_KEY)) {
      throw new BadRequestException('OpenAI API key is not configured')
    }

    if (!this.client) {
      this.client = new OpenAI({
        apiKey: OPENAI_API_KEY,
        baseURL: OPENAI_BASE_URL
      })
    }

    return this.client
  }

  async chatCompletion(request: ChatCompletionRequest) {
    return this.getClient().chat.completions.create({
      model: OPENAI_GPT_MODEL,
      temperature: 0,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: false,
      ...request
    })
  }
}
