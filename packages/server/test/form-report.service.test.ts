import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import * as assert from 'assert'

import { FormReportResolver } from '../src/resolver/form/form-report.resolver'
import { FormReportService } from '../src/service/form-report.service'
import { OTHER_CHOICE_ID } from '@heyform-inc/answer-utils'

const choices = [
  { id: 'motion', label: 'Motion' },
  { id: 'producer', label: 'Producer' }
]

async function generate(fields: any[], answers: any[][]) {
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
    { findAllByForm: async () => answers.map(row => ({ answers: row })) } as any,
    {} as any
  )

  await service.generate('form')
  return Object.fromEntries(saved.responses.map((row: any) => [row.id, row.chooses]))
}

function answer(id: string, kind: FieldKindEnum, value: unknown) {
  return { id, kind, value }
}

async function testCountsOtherAnswersBesideOptions() {
  const role = {
    id: 'role',
    kind: FieldKindEnum.MULTIPLE_CHOICE,
    properties: { allowOther: true, allowBlankOther: true, choices }
  }
  const legacy = {
    id: 'legacy',
    kind: FieldKindEnum.PICTURE_CHOICE,
    properties: { choices }
  }
  const plain = { id: 'plain', kind: FieldKindEnum.MULTIPLE_CHOICE, properties: { choices } }
  const yesNo = {
    id: 'yes-no',
    kind: FieldKindEnum.YES_NO,
    properties: {
      choices: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' }
      ]
    }
  }
  const chooses = await generate(
    [role, legacy, plain, yesNo],
    [
      [
        answer('role', role.kind, { value: ['motion'] }),
        answer('legacy', legacy.kind, { value: [], other: 'Old typed answer' }),
        answer('plain', plain.kind, { value: ['motion'] }),
        answer('yes-no', yesNo.kind, 'yes')
      ],
      [answer('role', role.kind, { value: [], other: 'Editor' })],
      // A blank "Other" counts, too.
      [answer('role', role.kind, { value: [], other: '' })]
    ]
  )

  assert.deepStrictEqual(chooses.role, [
    { id: 'motion', count: 1 },
    { id: 'producer', count: 0 },
    { id: OTHER_CHOICE_ID, count: 2 }
  ])
  // Other answers saved before "Other" was turned off still get a row.
  assert.deepStrictEqual(chooses.legacy, [
    { id: 'motion', count: 0 },
    { id: 'producer', count: 0 },
    { id: OTHER_CHOICE_ID, count: 1 }
  ])
  // Every choice question stores an Other count, so a report without one is from before they were counted.
  assert.deepStrictEqual(chooses.plain, [
    { id: 'motion', count: 1 },
    { id: 'producer', count: 0 },
    { id: OTHER_CHOICE_ID, count: 0 }
  ])
  assert.deepStrictEqual(chooses['yes-no'], [
    { id: 'yes', count: 1 },
    { id: 'no', count: 0 }
  ])
}

async function rebuildsReport(fields: any[], responses: any[]) {
  let queued = false
  const resolver = new FormReportResolver(
    {
      findById: async () => ({ responses }),
      addQueue: async () => {
        queued = true
      }
    } as any,
    { findAllGroupInFieldIds: async () => [] } as any
  )

  await resolver.formReport({ fields } as any, { formId: 'form' } as any)
  return queued
}

async function testRebuildsReportsSavedBeforeOtherWasCounted() {
  // "Other" has since been turned off, but answers given before that still need counting.
  const fields = [{ id: 'role', kind: FieldKindEnum.MULTIPLE_CHOICE, properties: { choices } }]
  const legacy = [{ id: 'role', chooses: [{ id: 'motion', count: 1 }] }]
  const current = [
    { id: 'role', chooses: [...legacy[0].chooses, { id: OTHER_CHOICE_ID, count: 0 }] }
  ]

  assert.strictEqual(await rebuildsReport(fields, legacy), true)
  assert.strictEqual(await rebuildsReport(fields, current), false)
}

async function run() {
  await testCountsOtherAnswersBesideOptions()
  await testRebuildsReportsSavedBeforeOtherWasCounted()
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})
