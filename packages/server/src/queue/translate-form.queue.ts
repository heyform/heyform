import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'

import { FormService } from '@service'

import { BaseQueue } from './base.queue'
import { helper } from '@heyform-inc/utils'
import { htmlUtils } from '@heyform-inc/answer-utils'

import { OpenAI } from 'openai'
import { OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_GPT_MODEL } from '@environments'
import { CHOICES_FIELD_KINDS } from '@heyform-inc/shared-types-enums'

interface TranslateFormQueueJob {
  formId: string
  language: string
}

const LANGUAGES = {
  en: 'English',
  de: 'German',
  fr: 'French',
  'zh-cn': 'Simplified Chinese',
  'zh-tw': 'Traditional Chinese'
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  baseURL: OPENAI_BASE_URL
})

@Processor('TranslateFormQueue')
export class TranslateFormQueue extends BaseQueue {
  constructor(private readonly formService: FormService) {
    super()
  }

  @Process()
  async generateReport(job: Job<TranslateFormQueueJob>): Promise<any> {
    const { formId, language } = job.data
    const form = await this.formService.findById(formId)

    if (!form || helper.isEmpty(form.settings?.languages) || helper.isEmpty(form.fields)) {
      return this.logger.info(
        `The form with ID ${formId} does not contain any questions requiring translation`
      )
    }

    const translations: Record<string, any> = {}

    form.fields.forEach(f => {
      const isTitleValid = helper.isValid(f.title)
      const isDescriptionValid = helper.isValid(f.description)

      if (isTitleValid || isDescriptionValid) {
        translations[f.id] = {}

        if (isTitleValid) {
          translations[f.id].title = htmlUtils.serialize(f.title as string[])
        }

        if (isDescriptionValid) {
          translations[f.id].description = htmlUtils.serialize(f.description as string[])
        }
      }

      if (CHOICES_FIELD_KINDS.includes(f.kind) && helper.isValidArray(f.properties?.choices)) {
        translations[f.id].choices = f.properties.choices.reduce(
          (prev, next) => ({ ...prev, [next.id]: next.label }),
          {}
        )
      }
    })

    if (helper.isValid(translations)) {
      const { choices } = await openai.chat.completions.create({
        model: OPENAI_GPT_MODEL,
        response_format: {
          type: 'json_object'
        },
        temperature: 0,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 1,
        presence_penalty: 1,
        stream: false,
        messages: [
          {
            role: 'user',
            content: `Translate this JSON to ${LANGUAGES[language]}, and keep all HTML tags and their attributes!`
          },
          {
            role: 'user',
            content: JSON.stringify(translations)
          }
        ]
      })

      if (helper.isValidArray(choices) && helper.isValid(choices[0].message.content)) {
        const translation = JSON.parse(choices[0].message.content)

        Object.keys(translation).forEach(id => {
          if (translation[id].title) {
            translation[id].title = htmlUtils.parse(translation[id].title)
          }

          if (translation[id].description) {
            translation[id].description = htmlUtils.parse(translation[id].description)
          }
        })

        await this.formService.update(formId, {
          [`translations.${language}`]: translation
        })
      }
    }
  }
}
