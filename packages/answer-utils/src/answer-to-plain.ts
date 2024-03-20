import parser from './answer-parser'
import { Answer, FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'

export function answersToPlain(answers: Answer[]): string {
  return answers
    .map(answer => {
      const value = parsePlainAnswer(answer)
      return `${answer.title}\n${value}`
    })
    .join('\n\n')
}

export function parsePlainAnswer(answer: Answer, livePreview = false): string {
  let value: string

  switch (answer.kind) {
    case FieldKindEnum.FILE_UPLOAD:
      const file = parser.fileUpload(answer, livePreview)
      value = livePreview ? file.filename : `${file.filename} (${file.url})`
      break

    case FieldKindEnum.RATING:
    case FieldKindEnum.OPINION_SCALE:
      value = parser.rating(answer)
      break

    case FieldKindEnum.YES_NO:
      value = parser.singleChoice(answer)
      break

    case FieldKindEnum.MULTIPLE_CHOICE:
    case FieldKindEnum.PICTURE_CHOICE:
      value = parser.multipleChoice(answer)
      break

    case FieldKindEnum.FULL_NAME:
      const name = parser.fullName(answer)
      value = `${name.firstName} ${name.lastName}`
      break

    case FieldKindEnum.ADDRESS:
      value = parser.address(answer)
      break

    case FieldKindEnum.LEGAL_TERMS:
      value = parser.legalTerms(answer)
      break

    case FieldKindEnum.DATE_RANGE:
      value = parser.dateRange(answer)
      break

    case FieldKindEnum.INPUT_TABLE:
      value = parser.inputTable(answer)
      break

    case FieldKindEnum.PAYMENT:
      value = parser.payment(answer)
      break

    default:
      value = answer.value?.toString()
  }

  if (livePreview && helper.isEmpty(value)) {
    value = '_____'
  }

  return value
}
