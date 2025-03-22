/**
 * Created by jiangwei on 2020/10/21.
 * Copyright (c) 2020 Heyooo, Inc. all rights reserved
 */

import {
  flattenFields,
  htmlUtils,
  parsePlainAnswer
} from '@heyform-inc/answer-utils'
import {
  Answer,
  FieldKindEnum,
  FormField,
  STATEMENT_FIELD_KINDS
} from '@heyform-inc/shared-types-enums'
import { helper, unixDate } from '@heyform-inc/utils'
import { FormModel, SubmissionModel } from '@model'
import { Injectable } from '@nestjs/common'
import { parseAsync } from 'json2csv'
import { CdnService } from './cdn.service'

const FIELD_ID_KEY = '#'
const START_DATE_KEY = 'Start Date (UTC)'
const SUBMIT_DATE_KEY = 'Submit Date (UTC)'

@Injectable()
export class ExportFileService {
  constructor(private readonly cdnService: CdnService) {}

  async csv(form: FormModel, submissions: SubmissionModel[]): Promise<string> {
    const records: Record<string, any>[] = []
    const selected = flattenFields(form.fields)
      .filter(field => !STATEMENT_FIELD_KINDS.includes(field.kind))
      .map(row => ({
        ...row,
        title: helper.isArray(row.title)
          ? htmlUtils.serialize(row.title)
          : row.title
      }))

    const fields: string[] = [
      FIELD_ID_KEY,
      ...selected.map(row => row.title),
      ...form.hiddenFields.map(row => row.name),
      ...form.variables.map(row => row.name),
      START_DATE_KEY,
      SUBMIT_DATE_KEY
    ]

    for (const submission of submissions) {
      const record: Record<string, any> = {
        [FIELD_ID_KEY]: submission.id
      }

      for (const row of selected) {
        let answer: any = submission.answers.find(a => a.id === row.id)

        if (helper.isEmpty(answer)) {
          answer = ''
        } else {
          answer = this.parseAnswer(answer)
        }

        record[row.title] = answer
      }

      for (const row of form.hiddenFields) {
        const hiddenField = submission.hiddenFields.find(h => h.id === row.id)

        record[row.name] = hiddenField?.value ?? ''
      }

      for (const row of form.variables) {
        const variable = submission.variables.find(v => v.id === row.id)

        record[row.name] = variable?.value ?? ''
      }

      record[START_DATE_KEY] = submission.startAt
        ? unixDate(submission.startAt!).toISOString()
        : ''
      record[SUBMIT_DATE_KEY] = submission.startAt
        ? unixDate(submission.endAt!).toISOString()
        : ''

      records.push(record)
    }

    return parseAsync(records, {
      fields
    })
  }

  exportCsv(formFields: FormField[], submissions: SubmissionModel[]): string {
    const fields = formFields.filter(
      field => !STATEMENT_FIELD_KINDS.includes(field.kind)
    )

    const header: string[] = [
      '#',
      ...fields.map(field => `"${field.title}"`),
      'Start Date (UTC)',
      'Submit Date (UTC)'
    ]
    const records: string[] = [header.join(',')]

    for (const submission of submissions) {
      const record: string[] = [submission.id]

      for (const field of fields) {
        const answer = submission.answers.find(answer => answer.id === field.id)

        if (helper.isEmpty(answer)) {
          record.push('')
        } else {
          // const result = this.parseAnswer(answer).replace(/\r|\n|\r\n/g, ' ')
          record.push(this.parseAnswer(answer))
        }
      }

      const startAt = submission.startAt
        ? unixDate(submission.startAt!).toISOString()
        : ''
      const endAt = submission.startAt
        ? unixDate(submission.endAt!).toISOString()
        : ''

      record.push(startAt)
      record.push(endAt)

      records.push(record.join(','))
    }

    return records.join('\n')
  }

  private parseAnswer(answer: Answer): string {
    const value = answer.value
    let result = ''

    if (helper.isEmpty(value)) {
      return result
    }

    switch (answer?.kind as any) {
      case 'custom_multiple':
      case 'custom_single':
        const choices = answer?.properties?.choices
          .filter(choice => value.value.includes(choice.id))
          .map(choice => choice.label)
        result = choices.join(',')
        break

      case FieldKindEnum.FILE_UPLOAD:
        result = this.cdnService.publicDownloadUrl(
          value?.cdnUrlPrefix,
          value?.cdnKey
        )
        break

      default:
        result = parsePlainAnswer(answer)
        break
    }

    return result
  }
}
