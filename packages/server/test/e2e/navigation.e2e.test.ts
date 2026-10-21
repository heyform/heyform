import * as assert from 'assert'

import { OTHER_CHOICE_ID } from '@heyform-inc/answer-utils'

import { E2EClient } from './helpers/client'
import { signUpUser } from './helpers/fixtures'
import {
  COMPLETE_SUBMISSION_GQL,
  CREATE_FORM_GQL,
  CREATE_TEAM_GQL,
  FORM_DETAIL_GQL,
  OPEN_FORM_GQL,
  PUBLIC_FORM_GQL,
  PUBLISH_FORM_GQL,
  SUBMISSIONS_GQL,
  TEAMS_GQL,
  UPDATE_FORM_LOGICS_GQL,
  UPDATE_FORM_SCHEMAS_GQL
} from './helpers/gql'
import { uniqueName } from './helpers/random'
import { defineSuite } from './helpers/runner'

const SUBMISSION_ANSWERS_GQL = /* GraphQL */ `
  query submissions($input: SubmissionsInput!) {
    submissions(input: $input) {
      submissions {
        id
        answers
      }
    }
  }
`

export function build(baseUrl: string) {
  const { suite, test } = defineSuite('navigation')
  let owner: E2EClient
  let formId: string
  let version: number
  const drafts = [
    ...['q1', 'q2', 'q3', 'q4', 'q5', 'q6'].map(id => ({
      id,
      kind: 'short_text',
      title: [id],
      validations: { required: true },
      nextFieldId: id === 'q1' ? 'q4' : id === 'q3' || id === 'q5' ? 'q6' : undefined
    })),
    { id: 'end', kind: 'thank_you', title: ['Thanks!'] }
  ]

  test('saves, reloads, and publishes a converging form with explicit defaults', async () => {
    owner = (await signUpUser(baseUrl)).client
    const teamId = await owner.gqlOk<string>('createTeam', CREATE_TEAM_GQL, {
      input: { name: uniqueName('Navigation'), projectName: 'Branches' }
    })
    const teams = await owner.gqlOk<any[]>('teams', TEAMS_GQL)
    const projectId = teams.find(team => team.id === teamId).projects[0].id
    formId = await owner.gqlOk<string>('createForm', CREATE_FORM_GQL, {
      input: { projectId, name: uniqueName('Branches'), kind: 1, interactiveMode: 1 }
    })
    const detail = await owner.gqlOk<any>('formDetail', FORM_DETAIL_GQL, { input: { formId } })
    const updated = await owner.gqlOk<any>('updateFormSchemas', UPDATE_FORM_SCHEMAS_GQL, {
      input: { formId, version: detail.version, drafts }
    })
    version = updated.version
    assert.strictEqual(updated.drafts.find((f: any) => f.id === 'q3').nextFieldId, 'q6')
    const reloaded = await owner.gqlOk<any>('formDetail', FORM_DETAIL_GQL, {
      input: { formId }
    })
    assert.strictEqual(reloaded.drafts.find((f: any) => f.id === 'q1').nextFieldId, 'q4')
    await owner.gqlOk('updateFormLogics', UPDATE_FORM_LOGICS_GQL, {
      input: {
        formId,
        logics: [
          {
            fieldId: 'q1',
            payloads: [
              {
                id: 'motion',
                condition: { comparison: 'is', expected: 'Motion Designer' },
                action: { kind: 'navigate', fieldId: 'q2' }
              }
            ]
          }
        ]
      }
    })
    await owner.gqlOk('publishForm', PUBLISH_FORM_GQL, { input: { formId, version, drafts } })
    const published = await new E2EClient({ baseUrl }).gqlOk<any>('publicForm', PUBLIC_FORM_GQL, {
      input: { formId }
    })
    assert.strictEqual(published.fields.find((f: any) => f.id === 'q3').nextFieldId, 'q6')
  })

  for (const [role, branch] of [
    ['Motion Designer', ['q2', 'q3']],
    ['Producer', ['q4', 'q5']]
  ] as const) {
    test(`${role} submits without answering the other branch's required questions`, async () => {
      const respondent = new E2EClient({ baseUrl })
      const openToken = await respondent.gqlOk<string>('openForm', OPEN_FORM_GQL, {
        input: { formId }
      })
      await respondent.gqlOk('completeSubmission', COMPLETE_SUBMISSION_GQL, {
        input: {
          formId,
          openToken,
          hiddenFields: [],
          answers: { q1: role, [branch[0]]: 'a', [branch[1]]: 'b', q6: 'c' }
        }
      })
    })
  }

  test('both submissions are archived', async () => {
    const submissions = await owner.gqlOk<any>('submissions', SUBMISSIONS_GQL, {
      input: { formId, category: 'inbox', page: 1, limit: 30 }
    })
    assert.strictEqual(submissions.total, 2)
  })

  test('invalid destinations cannot be saved or published', async () => {
    const detail = await owner.gqlOk<any>('formDetail', FORM_DETAIL_GQL, { input: { formId } })
    for (const nextFieldId of ['missing', 'q3', 'q1']) {
      const invalid = drafts.map(field => (field.id === 'q3' ? { ...field, nextFieldId } : field))
      for (const [operation, query] of [
        ['updateFormSchemas', UPDATE_FORM_SCHEMAS_GQL],
        ['publishForm', PUBLISH_FORM_GQL]
      ]) {
        const result = await owner.gql(operation, query, {
          input: { formId, version: detail.version, drafts: invalid }
        })
        assert.ok(result.errors.length > 0)
        assert.match(result.errors[0].message, /next question must be a later question/i)
      }
    }
    const after = await owner.gqlOk<any>('formDetail', FORM_DETAIL_GQL, { input: { formId } })
    assert.strictEqual(after.version, detail.version)
    assert.strictEqual(after.drafts.find((f: any) => f.id === 'q3').nextFieldId, 'q6')
  })

  test('forms with connections reject duplicate IDs and nested groups on save and publish', async () => {
    const detail = await owner.gqlOk<any>('formDetail', FORM_DETAIL_GQL, { input: { formId } })
    const invalidSchemas = [
      [...drafts, drafts[0]],
      [
        {
          id: 'outer',
          kind: 'group',
          properties: {
            fields: [
              {
                id: 'inner',
                kind: 'group',
                properties: {
                  fields: [{ id: 'child', kind: 'short_text', nextFieldId: 'missing' }]
                }
              }
            ]
          }
        }
      ]
    ]
    for (const invalid of invalidSchemas) {
      for (const [operation, query] of [
        ['updateFormSchemas', UPDATE_FORM_SCHEMAS_GQL],
        ['publishForm', PUBLISH_FORM_GQL]
      ]) {
        const result = await owner.gql(operation, query, {
          input: { formId, version: detail.version, drafts: invalid }
        })
        assert.ok(result.errors.length > 0)
        assert.match(result.errors[0].message, /IDs must be unique|Nested question groups/)
      }
    }
    const after = await owner.gqlOk<any>('formDetail', FORM_DETAIL_GQL, { input: { formId } })
    assert.strictEqual(after.version, detail.version)
  })

  test('clearing a default restores form order after reload', async () => {
    const detail = await owner.gqlOk<any>('formDetail', FORM_DETAIL_GQL, { input: { formId } })
    const cleared = drafts.map(field => ({ ...field, nextFieldId: undefined }))
    await owner.gqlOk('updateFormSchemas', UPDATE_FORM_SCHEMAS_GQL, {
      input: { formId, version: detail.version, drafts: cleared }
    })
    const after = await owner.gqlOk<any>('formDetail', FORM_DETAIL_GQL, { input: { formId } })
    assert.ok(after.drafts.every((field: any) => field.nextFieldId == null))
  })

  test('a branching choice question cannot be published until every option has a destination', async () => {
    const detail = await owner.gqlOk<any>('formDetail', FORM_DETAIL_GQL, { input: { formId } })
    const choiceDrafts = drafts.map(field =>
      field.id === 'q1'
        ? {
            ...field,
            kind: 'multiple_choice',
            nextFieldId: undefined,
            properties: {
              choices: [
                { id: 'motion', label: 'Motion Designer' },
                { id: 'producer', label: 'Producer' }
              ]
            }
          }
        : field
    )
    const jump = (choiceId: string, fieldId: string) => ({
      id: choiceId,
      condition: { comparison: 'is', expected: choiceId },
      action: { kind: 'navigate', fieldId }
    })
    const publish = async (payloads: any[], branchByAnswer?: boolean) => {
      await owner.gqlOk('updateFormLogics', UPDATE_FORM_LOGICS_GQL, {
        input: { formId, logics: [{ fieldId: 'q1', payloads, branchByAnswer }] }
      })
      return owner.gql('publishForm', PUBLISH_FORM_GQL, {
        input: { formId, version: detail.version, drafts: choiceDrafts }
      })
    }

    // An ordinary jump rule doesn't opt the question into branching.
    const ordinary = await publish([jump('motion', 'q2')])
    assert.ok(!ordinary.errors?.length, JSON.stringify(ordinary.errors))

    const partial = await publish([jump('motion', 'q2')], true)
    assert.ok(partial.errors.length > 0)
    assert.match(partial.errors[0].message, /every answer needs a destination/i)

    const complete = await publish([jump('motion', 'q2'), jump('producer', 'q4')], true)
    assert.ok(!complete.errors?.length, JSON.stringify(complete.errors))

    const respondent = new E2EClient({ baseUrl })
    const published = await respondent.gqlOk<any>('publicForm', PUBLIC_FORM_GQL, {
      input: { formId }
    })
    const invalidEdit = await publish([jump('motion', 'q2')], true)
    assert.match(invalidEdit.errors[0].message, /every answer needs a destination/i)
    const afterRejection = await respondent.gqlOk<any>('publicForm', PUBLIC_FORM_GQL, {
      input: { formId }
    })
    assert.deepStrictEqual(afterRejection.logics, published.logics)

    const pending = await owner.gqlOk<any>('formDetail', FORM_DETAIL_GQL, { input: { formId } })
    assert.strictEqual(pending.canPublish, true)
    assert.strictEqual(pending.draftLogics[0].payloads.length, 1)
    assert.deepStrictEqual(pending.logics, published.logics)

    // A rejected draft must not send Producer through the Motion-only required questions.
    const openToken = await respondent.gqlOk<string>('openForm', OPEN_FORM_GQL, {
      input: { formId }
    })
    await respondent.gqlOk('completeSubmission', COMPLETE_SUBMISSION_GQL, {
      input: {
        formId,
        openToken,
        hiddenFields: [],
        answers: { q1: { value: ['producer'] }, q4: 'a', q5: 'b', q6: 'c' }
      }
    })
  })

  test('an "Other" answer on a branching choice question follows its own destination', async () => {
    const detail = await owner.gqlOk<any>('formDetail', FORM_DETAIL_GQL, { input: { formId } })
    const choiceDrafts = drafts.map(field =>
      field.id === 'q1'
        ? {
            ...field,
            kind: 'multiple_choice',
            nextFieldId: undefined,
            properties: {
              allowOther: true,
              choices: [
                { id: 'motion', label: 'Motion Designer' },
                { id: 'producer', label: 'Producer' }
              ]
            }
          }
        : field
    )
    const jump = (choiceId: string, fieldId: string) => ({
      id: choiceId,
      condition: { comparison: 'is', expected: choiceId },
      action: { kind: 'navigate', fieldId }
    })
    const publish = async (payloads: any[]) => {
      await owner.gqlOk('updateFormLogics', UPDATE_FORM_LOGICS_GQL, {
        input: { formId, logics: [{ fieldId: 'q1', payloads, branchByAnswer: true }] }
      })
      return owner.gql('publishForm', PUBLISH_FORM_GQL, {
        input: { formId, version: detail.version, drafts: choiceDrafts }
      })
    }
    const options = [jump('motion', 'q2'), jump('producer', 'q4')]

    const missingOther = await publish(options)
    assert.match(missingOther.errors[0].message, /every answer needs a destination/i)

    const complete = await publish([...options, jump(OTHER_CHOICE_ID, 'q5')])
    assert.ok(!complete.errors?.length, JSON.stringify(complete.errors))

    // Only q5 -> q6 is on the Other route, so the required q2-q4 must not be demanded.
    const submit = async (other: string) => {
      const respondent = new E2EClient({ baseUrl })
      const openToken = await respondent.gqlOk<string>('openForm', OPEN_FORM_GQL, {
        input: { formId }
      })
      return respondent.gql('completeSubmission', COMPLETE_SUBMISSION_GQL, {
        input: {
          formId,
          openToken,
          hiddenFields: [],
          answers: { q1: { value: [], other }, q5: 'b', q6: 'c' }
        }
      })
    }
    const typed = await submit('Editor')
    assert.ok(!typed.errors?.length, JSON.stringify(typed.errors))

    // A blank "Other" is refused until the question allows it, then stored as an empty string.
    const refused = await submit('')
    assert.ok(refused.errors?.length > 0)

    const blankDrafts = choiceDrafts.map((field: any) =>
      field.id === 'q1'
        ? { ...field, properties: { ...field.properties, allowBlankOther: true } }
        : field
    )
    const latest = await owner.gqlOk<any>('formDetail', FORM_DETAIL_GQL, { input: { formId } })
    await owner.gqlOk('publishForm', PUBLISH_FORM_GQL, {
      input: { formId, version: latest.version, drafts: blankDrafts }
    })
    const blank = await submit('')
    assert.ok(!blank.errors?.length, JSON.stringify(blank.errors))

    const stored = await owner.gqlOk<any>('submissions', SUBMISSION_ANSWERS_GQL, {
      input: { formId, category: 'inbox', page: 1, limit: 30 }
    })
    const others = stored.submissions
      .map((submission: any) => submission.answers.find((answer: any) => answer.id === 'q1'))
      .filter((answer: any) => answer?.value?.other !== undefined)
      .map((answer: any) => answer.value.other)
    assert.deepStrictEqual(others.sort(), ['', 'Editor'])
  })

  test('saves and publishes fields and routing together, including clearing all rules', async () => {
    const detail = await owner.gqlOk<any>('formDetail', FORM_DETAIL_GQL, { input: { formId } })
    const respondent = new E2EClient({ baseUrl })
    const before = await respondent.gqlOk<any>('publicForm', PUBLIC_FORM_GQL, { input: { formId } })
    const newDrafts = [
      { id: 'new-start', kind: 'short_text', title: ['New question'] },
      { id: 'new-end', kind: 'thank_you', title: ['New ending'] }
    ]
    const logics = [
      {
        fieldId: 'new-start',
        payloads: [
          {
            id: 'new-rule',
            condition: { comparison: 'is', expected: 'done' },
            action: { kind: 'navigate', fieldId: 'new-end' }
          }
        ]
      }
    ]
    const saved = await owner.gqlOk<any>('updateFormSchemas', UPDATE_FORM_SCHEMAS_GQL, {
      input: { formId, version: detail.version, drafts: newDrafts, logics }
    })
    const draft = await owner.gqlOk<any>('formDetail', FORM_DETAIL_GQL, { input: { formId } })
    assert.deepStrictEqual(draft.draftLogics, logics)
    assert.strictEqual(draft.canPublish, true)
    const unchanged = await respondent.gqlOk<any>('publicForm', PUBLIC_FORM_GQL, {
      input: { formId }
    })
    assert.deepStrictEqual(unchanged.fields, before.fields)
    assert.deepStrictEqual(unchanged.logics, before.logics)

    await owner.gqlOk('publishForm', PUBLISH_FORM_GQL, {
      input: { formId, version: saved.version, drafts: newDrafts }
    })
    const published = await respondent.gqlOk<any>('publicForm', PUBLIC_FORM_GQL, {
      input: { formId }
    })
    assert.deepStrictEqual(
      published.fields.map((f: any) => f.id),
      ['new-start', 'new-end']
    )
    assert.deepStrictEqual(published.logics, logics)

    // Empty draft rules mean removal, not fallback to the published rules.
    const cleared = await owner.gqlOk<any>('updateFormSchemas', UPDATE_FORM_SCHEMAS_GQL, {
      input: { formId, version: saved.version, drafts: newDrafts, logics: [] }
    })
    assert.strictEqual(cleared.canPublish, true)
    await owner.gqlOk('publishForm', PUBLISH_FORM_GQL, {
      input: { formId, version: cleared.version, drafts: newDrafts }
    })
    const after = await respondent.gqlOk<any>('publicForm', PUBLIC_FORM_GQL, { input: { formId } })
    assert.deepStrictEqual(after.logics, [])
    const reloaded = await owner.gqlOk<any>('formDetail', FORM_DETAIL_GQL, { input: { formId } })
    assert.deepStrictEqual(reloaded.draftLogics, [])
    assert.strictEqual(reloaded.canPublish, false)
  })

  return suite
}
