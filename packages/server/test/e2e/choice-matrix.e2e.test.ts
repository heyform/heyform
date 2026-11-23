import assert from 'assert'

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
  TEAMS_GQL,
  UPDATE_FORM_SCHEMAS_GQL
} from './helpers/gql'
import { uniqueName } from './helpers/random'
import { defineSuite } from './helpers/runner'

const MATRIX_SUBMISSIONS_GQL = /* GraphQL */ `
  query submissions($input: SubmissionsInput!) {
    submissions(input: $input) {
      total
      submissions {
        answers
      }
    }
  }
`

export function build(baseUrl: string) {
  const { suite, test } = defineSuite('choice matrix')

  test('save and publish a matrix, validate respondent selections, and export by row', async () => {
    const { client } = await signUpUser(baseUrl)
    const teamId = await client.gqlOk<string>('createTeam', CREATE_TEAM_GQL, {
      input: { name: uniqueName('Matrix'), projectName: 'Survey' }
    })
    const teams = await client.gqlOk<any[]>('teams', TEAMS_GQL)
    const projectId = teams.find(team => team.id === teamId).projects[0].id
    const formId = await client.gqlOk<string>('createForm', CREATE_FORM_GQL, {
      input: { projectId, name: 'Matrix survey', interactiveMode: 1, kind: 1 }
    })
    const { version } = await client.gqlOk('formDetail', FORM_DETAIL_GQL, { input: { formId } })
    const properties = {
      matrixRows: [
        { id: 'speed', label: 'Speed' },
        { id: 'support', label: 'Support' }
      ],
      matrixColumns: [
        { id: 'poor', label: 'Poor' },
        { id: 'good', label: 'Good' }
      ]
    }
    const matrix = {
      id: 'matrix',
      kind: 'choice_matrix',
      title: ['Experience'],
      properties,
      validations: { required: true }
    }

    const invalidSchema = await client.gql('publishForm', PUBLISH_FORM_GQL, {
      input: {
        formId,
        version,
        drafts: [
          {
            ...matrix,
            properties: {
              ...properties,
              matrixRows: [properties.matrixRows[0], properties.matrixRows[0]]
            }
          }
        ]
      }
    })
    assert.match(invalidSchema.errors[0].message, /choice matrix/)

    const drafts = [matrix, { id: 'ending', kind: 'thank_you', title: ['Thanks!'] }]
    const saved = await client.gqlOk('updateFormSchemas', UPDATE_FORM_SCHEMAS_GQL, {
      input: { formId, drafts, version }
    })
    await client.gqlOk('publishForm', PUBLISH_FORM_GQL, {
      input: { formId, drafts, version: saved.version }
    })

    const respondent = new E2EClient({ baseUrl })
    const form = await respondent.gqlOk('publicForm', PUBLIC_FORM_GQL, { input: { formId } })
    assert.deepStrictEqual(
      form.fields.map((field: typeof matrix) => field.kind),
      ['choice_matrix', 'thank_you']
    )

    const speed = { rowId: 'speed', columnId: 'good' }
    const support = { rowId: 'support', columnId: 'poor' }
    const submit = async (value: unknown) => {
      const openToken = await respondent.gqlOk<string>('openForm', OPEN_FORM_GQL, {
        input: { formId }
      })
      return respondent.gql('completeSubmission', COMPLETE_SUBMISSION_GQL, {
        input: { formId, answers: { matrix: value }, hiddenFields: [], openToken }
      })
    }
    assert.match((await submit([speed])).errors[0].message, /required/)
    for (const invalid of [
      [speed, { ...support, rowId: 'speed' }],
      [speed, { ...support, rowId: 'unknown' }],
      [speed, { ...support, columnId: 'unknown' }]
    ]) {
      assert.match((await submit(invalid)).errors[0].message, /valid matrix selections/)
    }
    assert.deepStrictEqual((await submit([speed, support])).errors, [])

    const inbox = await client.gqlOk('submissions', MATRIX_SUBMISSIONS_GQL, {
      input: { formId, category: 'inbox', page: 1, limit: 10 }
    })
    assert.strictEqual(inbox.total, 1)
    const [answer] = inbox.submissions[0].answers
    assert.equal(answer.kind, 'choice_matrix')
    assert.deepStrictEqual(answer.value, [speed, support])
    assert.deepStrictEqual(answer.properties.matrixRows, properties.matrixRows)
    assert.deepStrictEqual(answer.properties.matrixColumns, properties.matrixColumns)

    const csv = await client.restGet(`/api/export/submissions?formId=${formId}`)
    assert.strictEqual(csv.status, 200)
    assert.match(csv.text, /"Experience — Speed","Experience — Support"/)
    assert.match(csv.text, /"Good","Poor"/)
  })

  return suite
}
