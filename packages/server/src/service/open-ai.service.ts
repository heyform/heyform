import { Injectable } from '@nestjs/common'
import { Configuration, OpenAIApi } from 'openai'
import {
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  OPENAI_GPT_MODEL
} from '@environments'
import { CreateChatCompletionRequest } from 'openai/api'

interface ChatCompletionRequest extends CreateChatCompletionRequest {
  response_format: Record<string, any>
}

@Injectable()
export class OpenAIService {
  private readonly openai: OpenAIApi

  constructor() {
    this.openai = new OpenAIApi(
      new Configuration({
        apiKey: OPENAI_API_KEY,
        basePath: OPENAI_BASE_URL
      })
    )
  }

  async chatCompletion(request: Partial<ChatCompletionRequest>) {
    const { data } = await this.openai.createChatCompletion({
      model: OPENAI_GPT_MODEL,
      temperature: 0,
      top_p: 1,
      frequency_penalty: 1,
      presence_penalty: 1,
      stream: false,
      ...request
    } as CreateChatCompletionRequest)

    return data
  }

  async chatCompletionStream(request: Partial<ChatCompletionRequest>) {
    return this.openai.createChatCompletion(
      {
        model: OPENAI_GPT_MODEL,
        temperature: 0,
        top_p: 1,
        frequency_penalty: 1,
        presence_penalty: 1,
        stream: true,
        ...request
      } as CreateChatCompletionRequest,
      {
        responseType: 'stream'
      }
    )
  }
}
