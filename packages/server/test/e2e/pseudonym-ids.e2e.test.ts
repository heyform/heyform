import assert from 'assert'

import { E2EClient } from './helpers/client'
import { signUpUser } from './helpers/fixtures'
import {
  COMPLETE_SUBMISSION_GQL,
  CREATE_FORM_GQL,
  CREATE_TEAM_GQL,
  FORM_DETAIL_GQL,
  OPEN_FORM_GQL,
  PUBLISH_FORM_GQL,
  SUBMISSIONS_GQL,
  TEAMS_GQL,
  UPDATE_FORM_GQL,
  UPDATE_FORM_SCHEMAS_GQL
} from './helpers/gql'
import { uniqueName } from './helpers/random'
import { defineSuite } from './helpers/runner'

const PSEUDONYM_ID_FORMAT = /^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/

export function build(baseUrl: string) {
  const { suite, test } = defineSuite('pseudonym ids')
  let owner: E2EClient
  let formId: string
  let firstId: string

  async function submit(choiceId: string) {
    const respondent = new E2EClient({ baseUrl })
    const openToken = await respondent.gqlOk<string>('openForm', OPEN_FORM_GQL, {
      input: { formId }
    })

    return respondent.gql('completeSubmission', COMPLETE_SUBMISSION_GQL, {
      input: { formId, openToken, hiddenFields: [], answers: { session: { value: [choiceId] } } }
    })
  }

  async function inbox() {
    return owner.gqlOk<any>('submissions', SUBMISSIONS_GQL, {
      input: { formId, category: 'inbox', page: 1, limit: 30 }
    })
  }

  test('publishes a form that generates pseudonym IDs', async () => {
    owner = (await signUpUser(baseUrl)).client
    const teamId = await owner.gqlOk<string>('createTeam', CREATE_TEAM_GQL, {
      input: { name: uniqueName('Pseudonym IDs'), projectName: 'Research' }
    })
    const teams = await owner.gqlOk<any[]>('teams', TEAMS_GQL)
    const projectId = teams.find(team => team.id === teamId).projects[0].id
    formId = await owner.gqlOk<string>('createForm', CREATE_FORM_GQL, {
      input: { projectId, name: uniqueName('Study'), kind: 1, interactiveMode: 1 }
    })
    const detail = await owner.gqlOk<any>('formDetail', FORM_DETAIL_GQL, { input: { formId } })
    const drafts = [
      {
        id: 'session',
        kind: 'multiple_choice',
        title: ['Session'],
        validations: { required: true },
        properties: {
          choices: [
            { id: 'a', label: 'Morning', limit: 1 },
            { id: 'b', label: 'Afternoon' }
          ]
        }
      },
      { id: 'end', kind: 'thank_you', title: ['Thanks!'] }
    ]
    const updated = await owner.gqlOk<any>('updateFormSchemas', UPDATE_FORM_SCHEMAS_GQL, {
      input: { formId, version: detail.version, drafts }
    })

    await owner.gqlOk('publishForm', PUBLISH_FORM_GQL, {
      input: { formId, version: updated.version, drafts }
    })
    await owner.gqlOk('updateForm', UPDATE_FORM_GQL, {
      input: { formId, generatePseudonymId: true }
    })
  })

  test('the respondent gets the ID that the owner sees on the submission', async () => {
    const result = await submit('a')
    assert.ok(!result.errors?.length, JSON.stringify(result.errors))

    firstId = result.data.pseudonymId
    assert.match(firstId, PSEUDONYM_ID_FORMAT)

    const { submissions } = await inbox()
    assert.deepStrictEqual(
      submissions.map((row: any) => row.pseudonymId),
      [firstId]
    )
  })

  test('choice limits still apply when IDs are generated', async () => {
    const full = await submit('a')
    assert.ok(full.errors?.length > 0)
    assert.match(full.errors[0].message, /"Morning" is full/)

    const other = await submit('b')
    assert.ok(!other.errors?.length, JSON.stringify(other.errors))
    assert.match(other.data.pseudonymId, PSEUDONYM_ID_FORMAT)
    assert.notStrictEqual(other.data.pseudonymId, firstId)
    assert.strictEqual((await inbox()).total, 2)
  })

  test('turning the setting off stops new IDs but keeps existing ones in the export', async () => {
    await owner.gqlOk('updateForm', UPDATE_FORM_GQL, {
      input: { formId, generatePseudonymId: false }
    })

    const result = await submit('b')
    assert.ok(!result.errors?.length, JSON.stringify(result.errors))
    assert.strictEqual(result.data.pseudonymId, null)

    const csv = await owner.restGet(`/api/export/submissions?formId=${encodeURIComponent(formId)}`)
    assert.strictEqual(csv.status, 200)

    const [header] = csv.text.split(/\r?\n/)
    assert.match(header, /^"#","Pseudonym ID",/)
    assert.ok(csv.text.includes(`"${firstId}"`), 'CSV should contain the first pseudonym ID')
  })

  return suite
}
