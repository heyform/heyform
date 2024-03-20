import parser from './answer-parser'
import { Answer, FieldKindEnum } from '@heyform-inc/shared-types-enums'

interface AnswersToJsonOptions {
  plain?: boolean
}

export function answersToJson(
  answers: Answer[],
  options?: AnswersToJsonOptions
): Record<string, any> {
  const result: Record<string, any> = {}

  answers.forEach(answer => {
    result[answer.id] = parseJsonAnswer(answer, options?.plain)
  })

  return result
}

function parseJsonAnswer(answer: Answer, plain = false): any {
  let value: any

  switch (answer.kind) {
    case FieldKindEnum.FILE_UPLOAD:
      value = parser.fileUpload(answer)
      if (plain) {
        value = `${value.filename} (${value.url})`
      }
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
      value = parser.fullName(answer)
      if (plain) {
        value = `${value.firstName} ${value.lastName}`
      }
      break

    case FieldKindEnum.ADDRESS:
      value = answer.value
      if (plain) {
        value = parser.address(answer)
      }
      break

    case FieldKindEnum.LEGAL_TERMS:
      value = parser.legalTerms(answer)
      break

    case FieldKindEnum.DATE_RANGE:
      value = answer.value
      if (plain) {
        value = parser.dateRange(answer)
      }
      break

    case FieldKindEnum.INPUT_TABLE:
      value = answer.value
      if (plain) {
        value = parser.inputTable(answer)
      }
      break

    case FieldKindEnum.PAYMENT:
      value = answer.value
      if (plain) {
        value = parser.payment(answer)
      }
      break

    default:
      value = answer.value?.toString()
  }

  return value
}
