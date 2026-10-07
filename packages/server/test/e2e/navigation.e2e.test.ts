import * as assert from 'assert'

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

  return suite
}
