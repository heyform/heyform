import { Injectable } from '@nestjs/common'
import { parseAsync } from 'json2csv'

import { htmlUtils, parsePlainAnswer } from '@heyform-inc/answer-utils'
import {
  Answer,
  FieldKindEnum,
  FormField,
  HiddenField,
  STATEMENT_FIELD_KINDS
} from '@heyform-inc/shared-types-enums'
import { helper, unixDate } from '@heyform-inc/utils'

import { SubmissionModel } from '@model'

const FIELD_ID_KEY = '#'
const START_DATE_KEY = 'Start Date (UTC)'
const SUBMIT_DATE_KEY = 'Submit Date (UTC)'

@Injectable()
export class ExportFileService {
  async csv(
    formFields: FormField[],
    selectedHiddenFields: HiddenField[],
    submissions: SubmissionModel[]
  ): Promise<string> {
    const records: Record<string, any>[] = []
    const selectedFormFields = formFields
      .filter(field => !STATEMENT_FIELD_KINDS.includes(field.kind))
      .map(field => ({
        ...field,
        title: helper.isArray(field.title) ? htmlUtils.serialize(field.title) : field.title
      }))

    const fields: string[] = [
      FIELD_ID_KEY,
      ...selectedFormFields.map(field => field.title),
      ...selectedHiddenFields.map(hiddenField => hiddenField.name),
      START_DATE_KEY,
      SUBMIT_DATE_KEY
    ]

    for (const submission of submissions) {
      const record: Record<string, any> = {
        [FIELD_ID_KEY]: submission.id
      }

      for (const field of selectedFormFields) {
        let answer: any = submission.answers.find(answer => answer.id === field.id)

        if (helper.isEmpty(answer)) {
          answer = ''
        } else {
          answer = this.parseAnswer(answer)
        }

        record[field.title] = answer
      }

      for (const selectedHiddenField of selectedHiddenFields) {
        const hiddenFieldValue = submission.hiddenFields.find(
          hiddenField => hiddenField.id === selectedHiddenField.id
        )?.value

        record[selectedHiddenField.name] = hiddenFieldValue
      }

      record[START_DATE_KEY] = submission.startAt ? unixDate(submission.startAt!).toISOString() : ''
      record[SUBMIT_DATE_KEY] = submission.startAt ? unixDate(submission.endAt!).toISOString() : ''

      records.push(record)
    }

    return parseAsync(records, {
      fields
    })
  }

  exportCsv(formFields: FormField[], submissions: SubmissionModel[]): string {
    const fields = formFields.filter(field => !STATEMENT_FIELD_KINDS.includes(field.kind))

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
          record.push(this.parseAnswer(answer))
        }
      }

      const startAt = submission.startAt ? unixDate(submission.startAt!).toISOString() : ''
      const endAt = submission.startAt ? unixDate(submission.endAt!).toISOString() : ''

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

    switch (answer?.kind) {
      case FieldKindEnum.FILE_UPLOAD:
        result = helper.isObject(value) ? value.url : helper.isString(value) ? value : ''
        break

      default:
        result = parsePlainAnswer(answer)
        break
    }

    return result
  }
}
