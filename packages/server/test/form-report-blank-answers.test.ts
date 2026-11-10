import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import assert from 'assert'

import { FormReportService } from '../src/service/form-report.service'
import { fieldValuesToAnswers } from '@heyform-inc/answer-utils'

const choices = [
  { id: 'motion', label: 'Motion' },
  { id: 'producer', label: 'Producer' }
]
const fields: any[] = [
  { id: 'rating', kind: FieldKindEnum.RATING, title: 'Rating', properties: { total: 5 } },
  { id: 'scale', kind: FieldKindEnum.OPINION_SCALE, title: 'Scale', properties: { total: 10 } },
  { id: 'comment', kind: FieldKindEnum.SHORT_TEXT, title: 'Comment' },
  { id: 'role', kind: FieldKindEnum.MULTIPLE_CHOICE, title: 'Role', properties: { choices } }
]

// Answers are stored the way completeSubmission stores them: a skipped optional question
// on the respondent's route is kept with an empty value.
async function generate(submissions: Record<string, any>[]) {
  let saved: any
  const service = new FormReportService(
    {
      findOne: async () => null,
      create: async (data: any) => {
        saved = data
        return { id: 'report' }
      }
    } as any,
    { findById: async () => ({ fields }) } as any,
    {} as any,
    {
      findAllByForm: async () =>
        submissions.map(values => ({ answers: fieldValuesToAnswers(fields, values) }))
    } as any,
    {} as any
  )

  await service.generate('form')
  return Object.fromEntries(saved.responses.map((row: any) => [row.id, row]))
}

async function testIgnoresSkippedAnswers() {
  const report = await generate([
    { rating: 5, scale: 9, comment: 'Great', role: { value: ['motion'] } },
    { rating: 5, scale: 9, role: { value: ['motion'] } },
    // Skipped every optional question
    {}
  ])

  assert.strictEqual(report.rating.count, 2)
  assert.strictEqual(report.rating.average, 5)
  // No one rated 0
  assert.strictEqual(report.rating.chooses[0], undefined)
  assert.strictEqual(report.rating.chooses[5], 2)
  assert.strictEqual(report.scale.count, 2)
  assert.strictEqual(report.scale.average, 9)
  assert.strictEqual(report.comment.count, 1)
  assert.strictEqual(report.role.count, 2)
}

async function testCountsEveryAnswerWhenNoneIsSkipped() {
  const report = await generate([
    { rating: 5, scale: 9, comment: 'Great', role: { value: ['motion'] } },
    { rating: 3, scale: 7, comment: 'Fine', role: { value: ['producer'] } }
  ])

  assert.strictEqual(report.rating.count, 2)
  assert.strictEqual(report.rating.average, 4)
  assert.strictEqual(report.scale.average, 8)
  assert.strictEqual(report.comment.count, 2)
  assert.strictEqual(report.role.count, 2)
}

async function run() {
  await testIgnoresSkippedAnswers()
  await testCountsEveryAnswerWhenNoneIsSkipped()
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})
