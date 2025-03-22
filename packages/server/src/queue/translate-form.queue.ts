import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'

import { FailedTaskService, FormService, OpenAIService } from '@service'

import { htmlUtils } from '@heyform-inc/answer-utils'
import { CHOICES_FIELD_KINDS } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
const { isEmpty, isValid, isValidArray } = helper
import * as template from 'art-template'
import { BaseQueue } from './base.queue'
import { LANGUAGES, TRANSLATE_PROMPT } from '@config'

interface TranslateFormQueueJob {
  formId: string
  language: string
}

@Processor('TranslateFormQueue')
export class TranslateFormQueue extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly formService: FormService,
    private readonly openAIService: OpenAIService
  ) {
    super(failedTaskService)
  }

  @Process()
  async translateForm(job: Job<TranslateFormQueueJob>): Promise<any> {
    const { formId, language } = job.data
    const form = await this.formService.findById(formId)

    if (!form || isEmpty(form.settings?.languages) || isEmpty(form.fields)) {
      return this.logger.info(
        `The form with ID ${formId} does not contain any questions requiring translation`
      )
    }

    const translations: Record<string, any> = {}

    form.fields.forEach(f => {
      const isTitleValid = isValid(f.title)
      const isDescriptionValid = isValid(f.description)

      if (isTitleValid || isDescriptionValid) {
        translations[f.id] = {}

        if (isTitleValid) {
          translations[f.id].title = htmlUtils.serialize(f.title as string[])
        }

        if (isDescriptionValid) {
          translations[f.id].description = htmlUtils.serialize(
            f.description as string[]
          )
        }
      }

      if (
        CHOICES_FIELD_KINDS.includes(f.kind) &&
        isValidArray(f.properties?.choices)
      ) {
        translations[f.id].choices = f.properties.choices.reduce(
          (prev, next) => ({ ...prev, [next.id]: next.label }),
          {}
        )
      }
    })

    if (isValid(translations)) {
      const content = template.render(TRANSLATE_PROMPT, {
        language: LANGUAGES[language],
        translations: JSON.stringify(translations)
      })

      const { choices } = await this.openAIService.chatCompletion({
        messages: [
          {
            role: 'user',
            content
          }
        ]
      })

      if (isValidArray(choices) && isValid(choices[0].message.content)) {
        const translation = JSON.parse(choices[0].message.content)

        Object.keys(translation).forEach(id => {
          if (translation[id].title) {
            translation[id].title = htmlUtils.parse(translation[id].title)
          }

          if (translation[id].description) {
            translation[id].description = htmlUtils.parse(
              translation[id].description
            )
          }
        })

        await this.formService.update(formId, {
          [`translations.${language}`]: translation
        })
      }
    }
  }
}
