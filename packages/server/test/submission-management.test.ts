import { SubmissionCategoryEnum, SubmissionStatusEnum } from '@heyform-inc/shared-types-enums'
import assert from 'assert'

import { DeleteSubmissionResolver } from '../src/resolver/submission/delete-submission.resolver'
import { SubmissionAnswersResolver } from '../src/resolver/submission/submission-answers.resolver'
import { SubmissionsResolver } from '../src/resolver/submission/submissions.resolver'
import { UpdateSubmissionsCategoryResolver } from '../src/resolver/submission/update-submissions-category.resolver'
import { SubmissionService } from '../src/service/submission.service'

type Row = Record<string, any>

// A submission model that records each query and answers with what the test prepared
function createModel(results: Row = {}) {
  const calls: Row[] = []

  function query(operation: string, conditions: Row, update?: Row) {
    const call: Row = { operation, conditions, ...(update && { update }) }
    const chain: Row = {
      select: (value: Row) => ((call.select = value), chain),
      skip: (value: number) => ((call.skip = value), chain),
      limit: (value: number) => ((call.limit = value), chain),
      sort: (value: Row) => ((call.sort = value), chain),
      then: (resolve: any, reject: any) => Promise.resolve(results[operation]).then(resolve, reject)
    }

    calls.push(call)
    return chain
  }

  const model = {
    find: (conditions: Row) => query('find', conditions),
    countDocuments: (conditions: Row) => query('countDocuments', conditions),
    deleteMany: (conditions: Row) => query('deleteMany', conditions),
    updateMany: (conditions: Row, update: Row) => query('updateMany', conditions, update)
  }

  return { calls, service: new SubmissionService(model as any, {} as any, {} as any) }
}

// The ids come from the request, the form from the guard: an id of another form's submission
// must match nothing
async function testDeletingByIdStaysInsideTheForm() {
  const { calls, service } = createModel({ deleteMany: { deletedCount: 2 } })

  assert.strictEqual(await service.deleteByIds('form_1', ['s1', 's2']), true)
  assert.deepStrictEqual(calls[0].conditions, { formId: 'form_1', _id: { $in: ['s1', 's2'] } })
}

async function testDeletingWithAnEmptySelectionDeletesNothing() {
  const { calls, service } = createModel({ deleteMany: { deletedCount: 0 } })

  // No ids at all means the whole form (turning the archive off), an empty list means none
  assert.strictEqual(await service.deleteByIds('form_1', []), false)
  assert.deepStrictEqual(calls[0].conditions, { formId: 'form_1', _id: { $in: [] } })

  await service.deleteByIds('form_1')
  assert.deepStrictEqual(calls[1].conditions, { formId: 'form_1' })
}

async function testDeletingAllTakesOneFormOrSeveral() {
  const { calls, service } = createModel({ deleteMany: { deletedCount: 1 } })

  assert.strictEqual(await service.deleteAll('form_1'), true)
  assert.strictEqual(await service.deleteAll(['form_1', 'form_2']), true)
  assert.deepStrictEqual(
    calls.map(call => call.conditions),
    [{ formId: 'form_1' }, { formId: { $in: ['form_1', 'form_2'] } }]
  )
}

async function testCategoryChangeStaysInsideTheForm() {
  const { calls, service } = createModel({ updateMany: { matchedCount: 1 } })

  assert.strictEqual(
    await service.updateCategory({
      formId: 'form_1',
      submissionIds: ['s1'],
      category: SubmissionCategoryEnum.SPAM
    }),
    true
  )
  assert.deepStrictEqual(calls[0].conditions, { formId: 'form_1', _id: { $in: ['s1'] } })
  assert.deepStrictEqual(calls[0].update, { category: SubmissionCategoryEnum.SPAM })

  // Nothing matched, e.g. the ids belong to another form
  const none = createModel({ updateMany: { matchedCount: 0 } })

  assert.strictEqual(
    await none.service.updateCategory({
      formId: 'form_1',
      submissionIds: ['other'],
      category: SubmissionCategoryEnum.SPAM
    }),
    false
  )
}

async function testInboxPagesThePublicSubmissionsOfAForm() {
  const { calls, service } = createModel({ find: [], countDocuments: 0 })

  await service.findAll({ formId: 'form_1' })
  assert.deepStrictEqual(calls[0], {
    operation: 'find',
    conditions: { formId: 'form_1', status: SubmissionStatusEnum.PUBLIC },
    // The respondent's IP address is left out unless it is asked for
    select: { ip: 0 },
    skip: 0,
    limit: 30,
    sort: { _id: -1 }
  })

  await service.findAll({
    formId: 'form_1',
    category: SubmissionCategoryEnum.INBOX,
    labelId: 'label_1',
    page: 3,
    limit: 10,
    withIp: true
  })
  assert.deepStrictEqual(calls[1].conditions, {
    formId: 'form_1',
    status: SubmissionStatusEnum.PUBLIC,
    category: SubmissionCategoryEnum.INBOX,
    labels: 'label_1'
  })
  assert.deepStrictEqual(calls[1].select, {})
  assert.strictEqual(calls[1].skip, 20)
  assert.strictEqual(calls[1].limit, 10)

  // The total has to count exactly what the pages list
  await service.count({
    formId: 'form_1',
    category: SubmissionCategoryEnum.INBOX,
    labelId: 'label_1'
  })
  assert.deepStrictEqual(calls[2].conditions, calls[1].conditions)
}

async function testAnswerListMatchesOneFieldOfPublicSubmissions() {
  const { calls, service } = createModel({ find: [], countDocuments: 0 })

  await service.countAllWithFieldId('form_1', 'field_1')
  await service.findAllWithFieldId('form_1', 'field_1', 2, 10)

  assert.deepStrictEqual(calls[0].conditions, {
    formId: 'form_1',
    answers: { $elemMatch: { id: 'field_1' } },
    status: SubmissionStatusEnum.PUBLIC
  })
  assert.deepStrictEqual(calls[1].conditions, calls[0].conditions)
  // Only the answer to that field is loaded, not the whole submission
  assert.deepStrictEqual(calls[1].select, {
    id: 1,
    answers: { $elemMatch: { id: 'field_1' } },
    endAt: 1
  })
  assert.strictEqual(calls[1].skip, 10)
  assert.strictEqual(calls[1].limit, 10)

  await service.countAllWithFieldId('form_1', 'field_1', true)
  assert.deepStrictEqual(calls[2].conditions.answers, {
    $elemMatch: { id: 'field_1', 'value.other': { $type: 'string', $ne: '' } }
  })
}

async function testInboxWithoutSubmissionsSkipsTheList() {
  let listed = 0
  const resolver = new SubmissionsResolver({
    count: async () => 0,
    findAll: async () => {
      listed += 1
      return []
    }
  } as any)

  assert.deepStrictEqual(
    await resolver.submissions({} as any, { settings: {} } as any, { formId: 'form_1' }),
    { total: 0, submissions: [] }
  )
  assert.strictEqual(listed, 0)
}

async function testInboxPassesTheFiltersToBothTheTotalAndTheList() {
  const counted: Row[] = []
  const listed: Row[] = []
  const rows = [{ id: 's1' }]
  const resolver = new SubmissionsResolver({
    count: async (options: Row) => {
      counted.push(options)
      return 41
    },
    findAll: async (options: Row) => {
      listed.push(options)
      return rows
    }
  } as any)

  const result = await resolver.submissions({} as any, { settings: {} } as any, {
    formId: 'form_1',
    category: SubmissionCategoryEnum.SPAM,
    labelId: 'label_1',
    page: 2,
    limit: 20
  })

  assert.deepStrictEqual(result, { total: 41, submissions: rows })
  assert.deepStrictEqual(counted, [
    { formId: 'form_1', category: SubmissionCategoryEnum.SPAM, labelId: 'label_1' }
  ])
  assert.deepStrictEqual(listed, [
    {
      formId: 'form_1',
      category: SubmissionCategoryEnum.SPAM,
      labelId: 'label_1',
      page: 2,
      limit: 20,
      withIp: false
    }
  ])
}

async function testAnswerListReturnsTheOneAnswerPerSubmission() {
  const queries: any[][] = []
  const resolver = new SubmissionAnswersResolver({
    countAllWithFieldId: async (...args: any[]) => {
      queries.push(args)
      return 2
    },
    findAllWithFieldId: async (...args: any[]) => {
      queries.push(args)
      return [
        { id: 's2', endAt: 200, answers: [{ id: 'field_1', kind: 'short_text', value: 'Ada' }] },
        { id: 's1', endAt: 100, answers: [{ id: 'field_1', kind: 'short_text', value: 'Bob' }] }
      ]
    }
  } as any)

  const result = await resolver.submissionAnswers({} as any, {
    formId: 'form_1',
    fieldId: 'field_1',
    page: 1,
    limit: 30,
    otherOnly: true
  })

  assert.deepStrictEqual(result, {
    total: 2,
    answers: [
      { submissionId: 's2', kind: 'short_text', value: 'Ada', endAt: 200 },
      { submissionId: 's1', kind: 'short_text', value: 'Bob', endAt: 100 }
    ]
  })
  assert.deepStrictEqual(queries, [
    ['form_1', 'field_1', true],
    ['form_1', 'field_1', 1, 30, true]
  ])

  const empty = new SubmissionAnswersResolver({
    countAllWithFieldId: async () => 0,
    findAllWithFieldId: async () => {
      throw new Error('nothing to list')
    }
  } as any)

  assert.deepStrictEqual(
    await empty.submissionAnswers({} as any, { formId: 'form_1', fieldId: 'field_1' }),
    { total: 0, answers: [] }
  )
}

// Both mutations act on the form the guard let the caller into, which is the one in the input
async function testInboxActionsActOnTheGuardedForm() {
  const calls: any[] = []
  const service = {
    deleteByIds: async (...args: any[]) => {
      calls.push(['delete', ...args])
      return true
    },
    updateCategory: async (options: Row) => {
      calls.push(['category', options])
      return true
    }
  }

  assert.strictEqual(
    await new DeleteSubmissionResolver(service as any).deleteSubmissions({
      formId: 'form_1',
      submissionIds: ['s1', 's2']
    }),
    true
  )
  assert.strictEqual(
    await new UpdateSubmissionsCategoryResolver(service as any).updateSubmissionsCategory({
      formId: 'form_1',
      submissionIds: ['s1'],
      category: SubmissionCategoryEnum.SPAM
    }),
    true
  )
  assert.deepStrictEqual(calls, [
    ['delete', 'form_1', ['s1', 's2']],
    ['category', { formId: 'form_1', submissionIds: ['s1'], category: SubmissionCategoryEnum.SPAM }]
  ])
}

async function run() {
  await testDeletingByIdStaysInsideTheForm()
  await testDeletingWithAnEmptySelectionDeletesNothing()
  await testDeletingAllTakesOneFormOrSeveral()
  await testCategoryChangeStaysInsideTheForm()
  await testInboxPagesThePublicSubmissionsOfAForm()
  await testAnswerListMatchesOneFieldOfPublicSubmissions()
  await testInboxWithoutSubmissionsSkipsTheList()
  await testInboxPassesTheFiltersToBothTheTotalAndTheList()
  await testAnswerListReturnsTheOneAnswerPerSubmission()
  await testInboxActionsActOnTheGuardedForm()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
