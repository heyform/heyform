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

export function build(baseUrl: string) {
  const { suite, test } = defineSuite('choice limits')
  let owner: E2EClient
  let formId: string

  async function submit(choiceId: string) {
    const respondent = new E2EClient({ baseUrl })
    const openToken = await respondent.gqlOk<string>('openForm', OPEN_FORM_GQL, {
      input: { formId }
    })

    return respondent.gql('completeSubmission', COMPLETE_SUBMISSION_GQL, {
      input: { formId, openToken, hiddenFields: [], answers: { workshop: { value: [choiceId] } } }
    })
  }

  async function total() {
    const result = await owner.gqlOk<any>('submissions', SUBMISSIONS_GQL, {
      input: { formId, category: 'inbox', page: 1, limit: 30 }
    })

    return result.total
  }

  test('publishes a form with a limited option and an IP limit', async () => {
    owner = (await signUpUser(baseUrl)).client
    const teamId = await owner.gqlOk<string>('createTeam', CREATE_TEAM_GQL, {
      input: { name: uniqueName('Choice limits'), projectName: 'Workshops' }
    })
    const teams = await owner.gqlOk<any[]>('teams', TEAMS_GQL)
    const projectId = teams.find(team => team.id === teamId).projects[0].id
    formId = await owner.gqlOk<string>('createForm', CREATE_FORM_GQL, {
      input: { projectId, name: uniqueName('Workshops'), kind: 1, interactiveMode: 1 }
    })
    const detail = await owner.gqlOk<any>('formDetail', FORM_DETAIL_GQL, { input: { formId } })
    const drafts = [
      {
        id: 'workshop',
        kind: 'multiple_choice',
        title: ['Workshop'],
        validations: { required: true },
        properties: {
          choices: [
            { id: 'a', label: 'Tuesday', limit: 1 },
            { id: 'b', label: 'Wednesday' }
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
    // Every respondent of the suite shares an IP, so it allows two submissions: one for each option
    await owner.gqlOk('updateForm', UPDATE_FORM_GQL, {
      input: { formId, enableIpLimit: true, ipLimitCount: 2 }
    })
  })

  test('the option is full once its limit is reached', async () => {
    const first = await submit('a')
    assert.ok(!first.errors?.length, JSON.stringify(first.errors))

    const second = await submit('a')
    assert.ok(second.errors.length > 0)
    assert.match(second.errors[0].message, /"Tuesday" is full/)
    assert.strictEqual(await total(), 1)
  })

  test('the rejected attempt does not use up the IP limit', async () => {
    const other = await submit('b')
    assert.ok(!other.errors?.length, JSON.stringify(other.errors))
    assert.strictEqual(await total(), 2)

    // The IP limit itself still applies
    const third = await submit('b')
    assert.ok(third.errors.length > 0)
    assert.match(third.errors[0].message, /submission quota limits/)
  })

  return suite
}
