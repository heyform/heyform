import { Answer, FieldKindEnum, QUESTION_FIELD_KINDS } from '@heyform-inc/shared-types-enums'

import parser from './answer-parser'
import { escapeHtmlText } from './escape-html'
import { htmlToText } from './helper'

export function answersToHtml(answers: Answer[]): string {
  const html = answers
    .map(answer => {
      const value = parseHtmlAnswer(answer)

      return `
<li>
  <h3>${escapeHtmlText(htmlToText(answer.title, 0))}</h3>
  <p>${escapeHtmlText(value)}</p>
</li>
`
    })
    .join('')

  return `<ol>${html}</ol>`
}

function parseHtmlAnswer(answer: Answer): string {
  let value = ''

  if (answer.value === '' || answer.value == null) {
    return value
  }

  if (QUESTION_FIELD_KINDS.includes(answer.kind)) {
    switch (answer.kind) {
      case FieldKindEnum.FILE_UPLOAD:
        const file = parser.fileUpload(answer)
        value = `${file.filename} (${file.url})`
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
  }

  return value
}
