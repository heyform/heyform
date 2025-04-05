import { Injectable } from '@nestjs/common'
import { Configuration, OpenAIApi } from 'openai'
import { OPENAI_API_KEY, OPENAI_BASE_URL } from '@environments'
import { CreateChatCompletionRequest } from 'openai/api'
import { TeamModel } from '@model'

interface ChatCompletionRequest extends CreateChatCompletionRequest {
  response_format: Record<string, any>
}

@Injectable()
export class OpenAIService {
  private readonly defaultOpenAI: OpenAIApi

  constructor() {
    this.defaultOpenAI = new OpenAIApi(
      new Configuration({
        apiKey: OPENAI_API_KEY,
        basePath: OPENAI_BASE_URL
      })
    )
  }

  private getOpenAIInstance(team?: TeamModel): OpenAIApi {
    // If team has custom AI configuration, use that
    if (team?.aiKey) {
      return new OpenAIApi(
        new Configuration({
          apiKey: team.aiKey,
          basePath: team.aiEndpoint || OPENAI_BASE_URL
        })
      )
    }

    // Otherwise use default configuration
    return this.defaultOpenAI
  }

  async chatCompletion(
    request: Partial<ChatCompletionRequest>,
    team?: TeamModel
  ) {
    const openai = this.getOpenAIInstance(team)
    const model = team?.aiModel || 'gpt-4o'

    try {
      const { data } = await openai.createChatCompletion({
        model,
        temperature: 0,
        top_p: 1,
        frequency_penalty: 1,
        presence_penalty: 1,
        stream: false,
        ...request
      } as CreateChatCompletionRequest)

      return data
    } catch (error) {
      console.error('OpenAI API Error:', error)
      throw error
    }
  }

  async chatCompletionStream(
    request: Partial<ChatCompletionRequest>,
    team?: TeamModel
  ) {
    const openai = this.getOpenAIInstance(team)
    const model = team?.aiModel || 'gpt-4o'

    return openai.createChatCompletion(
      {
        model,
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
