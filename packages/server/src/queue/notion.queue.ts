import { answersToApiObject } from '@heyform-inc/answer-utils'
import { mapToObject } from '@heyforms/integrations'
import { Process, Processor } from '@nestjs/bull'
import {
  FailedTaskService,
  IntegrationService,
  SubmissionService,
  ThirdPartyService
} from '@service'
import { Job } from 'bull'
import { Notion } from '@utils'
import { BaseQueue, IntegrationQueueJob } from './base.queue'
import { date, helper } from '@heyform-inc/utils'
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'

@Processor('NotionQueue')
export class NotionQueue extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly integrationService: IntegrationService,
    private readonly submissionService: SubmissionService,
    private readonly thirdPartyService: ThirdPartyService
  ) {
    super(failedTaskService)
  }

  @Process()
  async createRecord(job: Job<IntegrationQueueJob>): Promise<any> {
    const integration = await this.integrationService.findById(
      job.data.integrationId
    )
    const submission = await this.submissionService.findById(
      job.data.submissionId
    )

    const json = answersToApiObject(submission.answers)
    const thirdPartyOauth = await this.thirdPartyService.findById(
      integration.thirdPartyOauthId
    )

    const { database, fields } = mapToObject(integration.attributes)

    const notion = Notion.init({
      tokens: thirdPartyOauth.tokens as any
    })

    const result: Record<string, any> = {}

    for (const [answerId, key] of fields) {
      const jsonValue = json[answerId]

      if (!jsonValue) {
        continue
      }

      const field = database.fields.find(f => f.id === key)
      const { kind, value } = jsonValue

      // Date
      if (field.type === 'date') {
        if (kind === FieldKindEnum.DATE) {
          result[field.name] = {
            date: {
              start: date(value).toISOString()
            }
          }
        } else if (kind === FieldKindEnum.DATE_RANGE) {
          result[field.name] = {
            date: {
              start: date(value.start).toISOString(),
              end: date(value.end).toISOString()
            }
          }
        }
      }

      // Number
      else if (field.type === 'number') {
        result[field.name] = {
          number: Number(value)
        }
      }

      // Select
      else if (field.type === 'select') {
        result[field.name] = {
          select: {
            name: helper.isArray(value) ? value[0] : value
          }
        }
      }

      // Multi-select
      else if (field.type === 'multi_select') {
        result[field.name] = {
          multi_select: helper.isArray(value)
            ? value.map(v => ({ name: v }))
            : [{ name: value }]
        }
      }

      // Title or rich text
      else if (field.type === 'title' || field.type === 'rich_text') {
        result[field.name] = {
          [field.type]: [
            {
              type: 'text',
              text: {
                content: helper.isValidArray(value) ? value.join(', ') : value
              }
            }
          ]
        }
      }

      // Email, phone number, or URL
      else if (
        field.type === 'email' ||
        field.type === 'phone_number' ||
        field.type === 'url'
      ) {
        result[field.name] = {
          [field.type]: value
        }
      }

      // File
      else if (field.type === 'file') {
        result[field.name] = {
          files: [
            {
              type: 'external',
              name: value.filename,
              external: {
                url: value.url
              }
            }
          ]
        }
      }
    }

    this.logger.info(result)

    // Insert record
    await notion.createRecord(database.id, result)
  }
}
