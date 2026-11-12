import assert from 'assert'

import { E2EClient } from './helpers/client'
import { SignedUpUser, signUpUser } from './helpers/fixtures'
import {
  COMPLETE_SUBMISSION_GQL,
  CREATE_FORM_GQL,
  CREATE_TEAM_GQL,
  DELETE_FORM_GQL,
  FORMS_GQL,
  FORM_DETAIL_GQL,
  JOIN_TEAM_GQL,
  LEAVE_TEAM_GQL,
  MOVE_FORM_TO_TRASH_GQL,
  OPEN_FORM_GQL,
  PUBLISH_FORM_GQL,
  REMOVE_TEAM_MEMBER_GQL,
  RESET_TEAM_INVITE_CODE_GQL,
  RESTORE_FORM_GQL,
  SUBMISSIONS_GQL,
  TEAMS_GQL,
  TRANSFER_TEAM_GQL,
  UPDATE_FORM_SCHEMAS_GQL
} from './helpers/gql'
import { randomString, uniqueName } from './helpers/random'
import { defineSuite } from './helpers/runner'

/**
 * Stateful edges — server behaviour at boundaries that the happy-path
 * team-flow doesn't poke. Each test sets up its own scratch resources so
 * order independence is preserved.
 */
export function build(baseUrl: string) {
  const { suite, test } = defineSuite('stateful edges')

  // ── Helpers in-suite ──────────────────────────────────────────────────────
  async function provisionForm(): Promise<{
    owner: SignedUpUser
    teamId: string
    projectId: string
    formId: string
    fieldId: string
    version: number
    drafts: any[]
  }> {
    const owner = await signUpUser(baseUrl, { name: uniqueName('Edges') })
    const teamId = await owner.client.gqlOk<string>('createTeam', CREATE_TEAM_GQL, {
      input: { name: uniqueName('Edge WS'), projectName: uniqueName('Edge Seed') }
    })
    const teams = await owner.client.gqlOk<any[]>('teams', TEAMS_GQL)
    const team = teams.find(t => t.id === teamId)
    const projectId = team.projects[0].id
    const formId = await owner.client.gqlOk<string>('createForm', CREATE_FORM_GQL, {
      input: { projectId, name: uniqueName('Edge Form'), interactiveMode: 1, kind: 1 }
    })
    const detail = await owner.client.gqlOk<any>('formDetail', FORM_DETAIL_GQL, {
      input: { formId }
    })
    const fieldId = `f_${randomString(10)}`
    const drafts = [
      { id: fieldId, kind: 'short_text', title: ['Q?'], validations: { required: false } },
      {
        id: `f_${randomString(10)}`,
        kind: 'thank_you',
        title: ['Thanks!'],
        validations: { required: false }
      }
    ]
    const updated = await owner.client.gqlOk<any>('updateFormSchemas', UPDATE_FORM_SCHEMAS_GQL, {
      input: { formId, drafts, version: detail.version }
    })
    return { owner, teamId, projectId, formId, fieldId, version: updated.version, drafts }
  }

  // ── Optimistic-locking / version edges ───────────────────────────────────
  test('updateFormSchemas rejects a stale version', async () => {
    const f = await provisionForm()
    // f.version is the current draft version. Calling with an older one fails.
    const result = await f.owner.client.gql('updateFormSchemas', UPDATE_FORM_SCHEMAS_GQL, {
      input: { formId: f.formId, drafts: [], version: f.version - 1 }
    })
    assert.ok(result.errors.length > 0, 'stale version must reject')
  })

  test('publishForm rejects a stale version', async () => {
    const f = await provisionForm()
    const result = await f.owner.client.gql('publishForm', PUBLISH_FORM_GQL, {
      input: { formId: f.formId, drafts: [], version: f.version - 5 }
    })
    assert.ok(result.errors.length > 0)
  })

  // ── Trash lifecycle ──────────────────────────────────────────────────────
  test('moveFormToTrash twice in a row is idempotent (still TRASH)', async () => {
    const f = await provisionForm()
    const first = await f.owner.client.gqlOk<boolean>('moveFormToTrash', MOVE_FORM_TO_TRASH_GQL, {
      input: { formId: f.formId }
    })
    assert.strictEqual(first, true)
    const second = await f.owner.client.gqlOk<boolean>('moveFormToTrash', MOVE_FORM_TO_TRASH_GQL, {
      input: { formId: f.formId }
    })
    assert.strictEqual(second, true)

    const trash = await f.owner.client.gqlOk<any[]>('forms', FORMS_GQL, {
      input: { projectId: f.projectId, status: 2 }
    })
    assert.ok(trash.some(form => form.id === f.formId))
  })

  test('restoreForm on a form that is already NORMAL is a no-op success', async () => {
    const f = await provisionForm()
    // restoreForm on the never-trashed form. Server currently does not error.
    const result = await f.owner.client.gql('restoreForm', RESTORE_FORM_GQL, {
      input: { formId: f.formId }
    })
    assert.strictEqual(result.errors.length, 0, 'restoreForm on NORMAL is permitted')
    const list = await f.owner.client.gqlOk<any[]>('forms', FORMS_GQL, {
      input: { projectId: f.projectId, status: 1 }
    })
    assert.ok(list.some(x => x.id === f.formId))
  })

  test('deleteForm against a NORMAL form preserves the form and its submissions', async () => {
    const f = await provisionForm()
    await f.owner.client.gqlOk('publishForm', PUBLISH_FORM_GQL, {
      input: { formId: f.formId, version: f.version, drafts: f.drafts }
    })
    const respondent = new E2EClient({ baseUrl })
    const openToken = await respondent.gqlOk<string>('openForm', OPEN_FORM_GQL, {
      input: { formId: f.formId }
    })
    await respondent.gqlOk('completeSubmission', COMPLETE_SUBMISSION_GQL, {
      input: { formId: f.formId, answers: {}, hiddenFields: [], openToken }
    })
    const inbox = () =>
      f.owner.client.gqlOk<any>('submissions', SUBMISSIONS_GQL, {
        input: { formId: f.formId, category: 'inbox', page: 1, limit: 30 }
      })
    const before = await inbox()
    assert.strictEqual(before.total, 1)
    const claimed = await f.owner.client.gqlOk<boolean>('deleteForm', DELETE_FORM_GQL, {
      input: { formId: f.formId }
    })
    assert.strictEqual(claimed, true, 'server currently returns true even when nothing was deleted')

    const list = await f.owner.client.gqlOk<any[]>('forms', FORMS_GQL, {
      input: { projectId: f.projectId, status: 1 }
    })
    assert.ok(
      list.some(form => form.id === f.formId),
      'form is still around'
    )
    assert.deepStrictEqual(await inbox(), before, 'a live form must keep its responses')
  })

  // ── Cross-team data leakage ──────────────────────────────────────────────
  test('a workspace member cannot read another workspace’s form by id', async () => {
    const a = await provisionForm()
    const b = await provisionForm()

    const stranger = a.owner.client
    const res = await stranger.gql('formDetail', FORM_DETAIL_GQL, {
      input: { formId: b.formId }
    })
    assert.ok(res.errors.length > 0, 'cross-team formDetail must be forbidden')
  })

  test("a workspace member cannot list forms of another workspace's project", async () => {
    const a = await provisionForm()
    const b = await provisionForm()
    const res = await a.owner.client.gql('forms', FORMS_GQL, {
      input: { projectId: b.projectId, status: 1 }
    })
    assert.ok(res.errors.length > 0)
  })

  // ── Invite / join edges ──────────────────────────────────────────────────
  test('joinTeam fails with the wrong invite code', async () => {
    const f = await provisionForm()
    const guest = await signUpUser(baseUrl, { name: uniqueName('Guest') })
    const res = await guest.client.gql('joinTeam', JOIN_TEAM_GQL, {
      input: { teamId: f.teamId, inviteCode: 'totally-wrong-code' }
    })
    assert.ok(res.errors.length > 0)
    assert.match(
      res.errors[0].message,
      /invitation code|does not match/i,
      `wrong-code error: ${res.errors[0].message}`
    )
  })

  test('joinTeam fails when the user already joined', async () => {
    const f = await provisionForm()
    const teams = await f.owner.client.gqlOk<any[]>('teams', TEAMS_GQL)
    const inviteCode = teams.find(t => t.id === f.teamId)!.inviteCode

    const guest = await signUpUser(baseUrl, { name: uniqueName('Repeat') })
    await guest.client.gqlOk<boolean>('joinTeam', JOIN_TEAM_GQL, {
      input: { teamId: f.teamId, inviteCode }
    })
    const second = await guest.client.gql('joinTeam', JOIN_TEAM_GQL, {
      input: { teamId: f.teamId, inviteCode }
    })
    assert.ok(second.errors.length > 0)
    assert.match(second.errors[0].message, /already joined/i)
  })

  test('joinTeam fails after the invite code has been rotated', async () => {
    const f = await provisionForm()
    const teamsBefore = await f.owner.client.gqlOk<any[]>('teams', TEAMS_GQL)
    const oldCode = teamsBefore.find(t => t.id === f.teamId)!.inviteCode

    await f.owner.client.gqlOk<boolean>('resetTeamInviteCode', RESET_TEAM_INVITE_CODE_GQL, {
      input: { teamId: f.teamId }
    })

    const guest = await signUpUser(baseUrl, { name: uniqueName('Stale') })
    const res = await guest.client.gql('joinTeam', JOIN_TEAM_GQL, {
      input: { teamId: f.teamId, inviteCode: oldCode }
    })
    assert.ok(res.errors.length > 0)
    assert.match(res.errors[0].message, /invitation code|does not match/i)
  })

  // ── Team membership / ownership edges ────────────────────────────────────
  test('leaveTeam blocks the workspace owner', async () => {
    const f = await provisionForm()
    const res = await f.owner.client.gql('leaveTeam', LEAVE_TEAM_GQL, {
      input: { teamId: f.teamId }
    })
    assert.ok(res.errors.length > 0)
  })

  test('removeTeamMember refuses to remove the workspace owner', async () => {
    const f = await provisionForm()
    const res = await f.owner.client.gql('removeTeamMember', REMOVE_TEAM_MEMBER_GQL, {
      input: { teamId: f.teamId, memberId: f.owner.id }
    })
    assert.ok(res.errors.length > 0)
  })

  test('transferTeam rejects a non-member target', async () => {
    const f = await provisionForm()
    const outsider = await signUpUser(baseUrl, { name: uniqueName('Outsider') })
    const res = await f.owner.client.gql('transferTeam', TRANSFER_TEAM_GQL, {
      input: { teamId: f.teamId, memberId: outsider.id }
    })
    assert.ok(res.errors.length > 0, 'transfer to non-member must error')
  })

  // ── Public form / submission edges ───────────────────────────────────────
  test('openForm fails on an unpublished form', async () => {
    const f = await provisionForm()
    const respondent = new E2EClient({ baseUrl })
    const res = await respondent.gql('openForm', OPEN_FORM_GQL, {
      input: { formId: f.formId }
    })
    assert.ok(res.errors.length > 0)
    assert.match(res.errors[0].message, /not active|suspended/i)
  })

  test('completeSubmission rejects an invalid openToken', async () => {
    const f = await provisionForm()
    // Publish the form so openForm wouldn't be the source of failure
    await f.owner.client.gqlOk<boolean>('publishForm', PUBLISH_FORM_GQL, {
      input: { formId: f.formId, drafts: [], version: f.version }
    })
    const respondent = new E2EClient({ baseUrl })
    const res = await respondent.gql('completeSubmission', COMPLETE_SUBMISSION_GQL, {
      input: {
        formId: f.formId,
        answers: {},
        hiddenFields: [],
        openToken: 'not-a-real-token'
      }
    })
    assert.ok(res.errors.length > 0)
  })

  return suite
}
