import { FORM_REPORT_RATE } from '@environments'
import { flattenFields } from '@heyform-inc/answer-utils'
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { FormReportModel, FormReportResponse } from '@model'
import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Queue } from 'bull'
import { Model } from 'mongoose'
import { FormService } from './form.service'
import { RedisService } from './redis.service'
import { SubmissionService } from './submission.service'

@Injectable()
export class FormReportService {
  constructor(
    @InjectModel(FormReportModel.name)
    private readonly formReportModel: Model<FormReportModel>,
    private readonly formService: FormService,
    private readonly redisService: RedisService,
    private readonly submissionService: SubmissionService,
    @InjectQueue('FormReportQueue')
    private readonly formReportQueue: Queue
  ) {}

  public async findById(formId: string): Promise<FormReportModel | null> {
    return this.formReportModel.findOne({
      formId
    })
  }

  public async addQueue(formId: string): Promise<void> {
    const redisKey = `rate:FormReportQueue:${formId}`
    const cache = await this.redisService.get(redisKey)

    if (helper.isEmpty(cache)) {
      await this.redisService.set({
        key: redisKey,
        value: 1,
        duration: FORM_REPORT_RATE
      })
      this.formReportQueue.add({
        formId
      })
    }
  }

  public async generate(formId: string): Promise<void> {
    const form = await this.formService.findById(formId)
    if (!form || form.fields.length < 1) {
      return
    }

    const submissions = await this.submissionService.findAllByForm(formId)
    if (submissions.length < 1) {
      return
    }

    const responses: FormReportResponse[] = []
    const fields = flattenFields(form.fields)

    for (const field of fields) {
      const answers = submissions
        .map(submission =>
          submission.answers.find(answer => answer.id === field.id)
        )
        .filter(Boolean)
      const count = answers.length

      if (count < 1) {
        continue
      }

      const response = {
        id: field.id,
        total: submissions.length,
        count,
        average: 0,
        chooses: []
      }

      for (const answer of answers) {
        if (helper.isNil(answer.value)) {
          continue
        }

        switch (field.kind as any) {
          case FieldKindEnum.YES_NO:
          case FieldKindEnum.MULTIPLE_CHOICE:
          case FieldKindEnum.PICTURE_CHOICE:
          case 'custom_single':
          case 'custom_multiple':
            const choices = field.properties.choices

            if (helper.isValidArray(choices)) {
              let values = answer.value.value

              if (answer.kind === FieldKindEnum.YES_NO) {
                values = [answer.value]
              }

              response.chooses = choices!.map(choice => {
                const count = values.includes(choice.id) ? 1 : 0
                const prevChoice = response.chooses.find(
                  row => row.id === choice.id
                )
                const prevCount = prevChoice?.count ?? 0

                return {
                  id: choice.id,
                  count: prevCount + count
                } as any
              })
            }
            break

          case FieldKindEnum.OPINION_SCALE:
          case FieldKindEnum.RATING:
            const value = Number(answer.value)

            response.average += value
            response.chooses[value] = (response.chooses[value] || 0) + 1
            break
        }
      }

      response.average = parseFloat(
        (response.average / response.count).toFixed(1)
      )

      if (isNaN(response.average)) {
        response.average = 0
      }

      responses.push(response)
    }

    const formReport = await this.findById(formId)

    if (formReport) {
      await this.update(formReport.id, { responses })
    } else {
      await this.create({
        formId,
        responses
      })
    }
  }

  async create(data: FormReportModel | any): Promise<string | undefined> {
    const result = await this.formReportModel.create(data)
    return result.id
  }

  async update(id: string, updates: Record<string, any>): Promise<any> {
    const result = await this.formReportModel.updateOne(
      {
        _id: id
      },
      updates
    )
    return !!result?.ok
  }
}
