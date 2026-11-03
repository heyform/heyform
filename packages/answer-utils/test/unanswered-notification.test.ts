import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { expect, test } from 'vitest'

import { answersToHtml, fieldValuesToAnswers } from '../src'

test.each([FieldKindEnum.FULL_NAME, FieldKindEnum.FILE_UPLOAD, FieldKindEnum.ADDRESS])(
  'renders an unanswered optional %s as blank',
  kind => {
    const answers = fieldValuesToAnswers(
      [{ id: 'q', title: 'Question', kind, validations: { required: false } }],
      {}
    )

    expect(answersToHtml(answers)).toContain('<p></p>')
  }
)

test('preserves a declined optional legal terms answer', () => {
  const answers = fieldValuesToAnswers(
    [{ id: 'q', title: 'Question', kind: FieldKindEnum.LEGAL_TERMS }],
    { q: false }
  )

  expect(answersToHtml(answers)).toContain('<p>No</p>')
})
