import * as assert from 'assert'

import { E2EClient } from './helpers/client'
import { SignedUpUser, signUpUser } from './helpers/fixtures'
import {
  COMPLETE_SUBMISSION_GQL,
  CREATE_FORM_GQL,
  CREATE_PROJECT_GQL,
  CREATE_TEAM_GQL,
  DELETE_FORM_GQL,
  DELETE_PROJECT_CODE_GQL,
  DELETE_PROJECT_GQL,
  DELETE_SUBMISSIONS_GQL,
  DISSOLVE_TEAM_CODE_GQL,
  DISSOLVE_TEAM_GQL,
  FORMS_GQL,
  FORM_DETAIL_GQL,
  MOVE_FORM_TO_TRASH_GQL,
  OPEN_FORM_GQL,
  PUBLIC_FORM_GQL,
  PUBLISH_FORM_GQL,
  SIGN_UP_GQL,
  SUBMISSIONS_GQL,
  TEAMS_GQL,
  TEAM_MEMBERS_GQL,
  UPDATE_FORM_SCHEMAS_GQL,
  UPDATE_SUBMISSIONS_CATEGORY_GQL,
  UPDATE_TEAM_GQL
} from './helpers/gql'
import { randomString, strongPassword, uniqueEmail, uniqueName } from './helpers/random'
import { defineSuite } from './helpers/runner'
import { seedProjectMember, seedTeamMember } from './helpers/seed'
import { readLatestVerificationCode } from './helpers/verification'

const ROLE_ADMIN = 1
const ROLE_COLLABORATOR = 2
const ROLE_MEMBER = 3

interface FlowState {
  admin: SignedUpUser
  collaborator: SignedUpUser
  member: SignedUpUser
  teamId: string
  inviteCode: string
  seedProjectId: string
  projectId: string
  formId: string
  fieldId: string
  submissionId: string
}

function need<K extends keyof FlowState>(state: Partial<FlowState>, keys: K[]): Pick<FlowState, K> {
  const missing = keys.filter(k => state[k] === undefined)
  if (missing.length > 0) {
    throw new Error(`Flow state missing: ${missing.join(', ')}`)
  }
  return state as Pick<FlowState, K>
}

/**
 * Single stateful run: admin creates a workspace, COLLABORATOR joins by invite
 * code, MEMBER is seeded (no server mutation exists for that role), then
 * admin walks workspace → project → form → submission → delete cascade.
 *
 * Each role keeps its own `E2EClient`/cookie jar across all tests so we never
 * re-authenticate. Permission probes confirm that non-admins are blocked from
 * destructive ops.
 */
export function build(baseUrl: string) {
  const { suite, test } = defineSuite('team flow')
  const state: Partial<FlowState> = {}

  // ── Setup phase: one signup per role ──────────────────────────────────────
  test('admin signs up and creates the workspace', async () => {
    const admin = await signUpUser(baseUrl, { name: uniqueName('Admin') })
    state.admin = admin

    const teamId = await admin.client.gqlOk<string>('createTeam', CREATE_TEAM_GQL, {
      input: {
        name: uniqueName('Flow WS'),
        projectName: uniqueName('Seed Project')
      }
    })
    state.teamId = teamId

    const teams = await admin.client.gqlOk<any[]>('teams', TEAMS_GQL)
    const team = teams.find(t => t.id === teamId)
    assert.ok(team, 'team listed for admin')
    assert.strictEqual(team.isOwner, true)
    assert.ok(team.inviteCode, 'invite code seeded')
    assert.ok(team.projects?.[0]?.id, 'auto-seeded project exists')
    state.inviteCode = team.inviteCode
    state.seedProjectId = team.projects[0].id
  })

  test('sign-up rejects an invalid workspace invitation', async () => {
    const { teamId } = need(state, ['teamId'])
    const client = new E2EClient({ baseUrl })
    const result = await client.gql('signUp', SIGN_UP_GQL, {
      input: {
        name: uniqueName('Invalid Invite'),
        email: uniqueEmail('invalid-invite'),
        password: strongPassword(),
        teamId,
        inviteCode: 'totally-wrong-code'
      }
    })

    assert.ok(result.errors.length > 0, 'invalid invitation should error')
    assert.match(result.errors[0].message, /invitation.*invalid|invalid.*invitation/i)
    assert.strictEqual(client.isAuthenticated(), false)
  })

  test('collaborator joins the workspace during sign-up with an invitation', async () => {
    const { teamId, inviteCode } = need(state, ['teamId', 'inviteCode'])
    const collaborator = await signUpUser(baseUrl, {
      name: uniqueName('Collab'),
      teamId,
      inviteCode
    })
    state.collaborator = collaborator

    const teams = await collaborator.client.gqlOk<any[]>('teams', TEAMS_GQL)
    assert.ok(
      teams.some(t => t.id === teamId),
      'collaborator sees the team'
    )
  })

  test('member is provisioned via direct seed (no public role API exists)', async () => {
    const { teamId } = need(state, ['teamId'])
    const member = await signUpUser(baseUrl, { name: uniqueName('Member') })
    state.member = member

    await seedTeamMember({ teamId, memberId: member.id, role: ROLE_MEMBER })

    const teams = await member.client.gqlOk<any[]>('teams', TEAMS_GQL)
    assert.ok(
      teams.some(t => t.id === teamId),
      'member sees the team after seeding'
    )
  })

  // ── Verification phase: admin sees roles assigned correctly ───────────────
  test('teamMembers lists admin/collaborator/member with correct roles', async () => {
    const { admin, collaborator, member, teamId } = need(state, [
      'admin',
      'collaborator',
      'member',
      'teamId'
    ])
    const members = await admin.client.gqlOk<any[]>('teamMembers', TEAM_MEMBERS_GQL, {
      input: { teamId }
    })
    assert.strictEqual(members.length, 3, 'three members in workspace')

    const byEmail = new Map(members.map(m => [m.email, m]))
    const a = byEmail.get(admin.email.toLowerCase())
    const c = byEmail.get(collaborator.email.toLowerCase())
    const m = byEmail.get(member.email.toLowerCase())
    assert.ok(a && c && m, 'all three accounts surfaced')
    assert.strictEqual(a.role, ROLE_ADMIN)
    assert.strictEqual(a.isOwner, true)
    assert.strictEqual(c.role, ROLE_COLLABORATOR)
    assert.strictEqual(c.isOwner, false)
    assert.strictEqual(m.role, ROLE_MEMBER)
    assert.strictEqual(m.isOwner, false)
  })

  // ── Project + form lifecycle ──────────────────────────────────────────────
  test('admin creates a project and adds collaborator+member as project members', async () => {
    const { admin, collaborator, member, teamId } = need(state, [
      'admin',
      'collaborator',
      'member',
      'teamId'
    ])
    const projectId = await admin.client.gqlOk<string>('createProject', CREATE_PROJECT_GQL, {
      input: {
        teamId,
        name: uniqueName('Flow Project'),
        memberIds: [collaborator.id, member.id]
      }
    })
    state.projectId = projectId

    // memberIds wiring is best-effort in createProject; ensure they're members
    // so PermissionGuard's project-scope check passes for both non-admin roles.
    await seedProjectMember({ projectId, memberId: collaborator.id })
    await seedProjectMember({ projectId, memberId: member.id })

    const teams = await admin.client.gqlOk<any[]>('teams', TEAMS_GQL)
    const team = teams.find(t => t.id === teamId)
    assert.ok(
      team.projects.some((p: any) => p.id === projectId),
      'project listed'
    )
  })

  test('admin creates a form in the project', async () => {
    const { admin, projectId } = need(state, ['admin', 'projectId'])
    const formId = await admin.client.gqlOk<string>('createForm', CREATE_FORM_GQL, {
      input: {
        projectId,
        name: uniqueName('Flow Form'),
        interactiveMode: 1,
        kind: 1
      }
    })
    state.formId = formId

    const forms = await admin.client.gqlOk<any[]>('forms', FORMS_GQL, {
      input: { projectId, status: 1 }
    })
    assert.ok(
      forms.some(f => f.id === formId),
      'form listed'
    )
  })

  test('admin publishes a single short_text + thank_you form', async () => {
    const { admin, formId } = need(state, ['admin', 'formId'])

    const detail = await admin.client.gqlOk<any>('formDetail', FORM_DETAIL_GQL, {
      input: { formId }
    })

    const fieldId = `f_${randomString(10)}`
    state.fieldId = fieldId
    const drafts = [
      {
        id: fieldId,
        kind: 'short_text',
        title: ['What is your name?'],
        validations: { required: false }
      },
      {
        id: `f_${randomString(10)}`,
        kind: 'thank_you',
        title: ['Thanks!'],
        validations: { required: false }
      }
    ]

    const updated = await admin.client.gqlOk<any>('updateFormSchemas', UPDATE_FORM_SCHEMAS_GQL, {
      input: { formId, drafts, version: detail.version }
    })
    assert.strictEqual(updated.version, detail.version + 1)

    const published = await admin.client.gqlOk<boolean>('publishForm', PUBLISH_FORM_GQL, {
      input: { formId, drafts, version: updated.version }
    })
    assert.strictEqual(published, true)
  })

  test('anonymous respondent receives the workspace branding setting', async () => {
    const { admin, formId, teamId } = need(state, ['admin', 'formId', 'teamId'])

    await admin.client.gqlOk<boolean>('updateTeam', UPDATE_TEAM_GQL, {
      input: { teamId, removeBranding: true }
    })

    const respondent = new E2EClient({ baseUrl })
    const publicForm = await respondent.gqlOk<any>('publicForm', PUBLIC_FORM_GQL, {
      input: { formId }
    })
    assert.strictEqual(publicForm.settings.removeBranding, true)
  })

  test('anonymous respondent submits to the form', async () => {
    const { formId, fieldId } = need(state, ['formId', 'fieldId'])

    const respondent = new E2EClient({ baseUrl })
    const publicForm = await respondent.gqlOk<any>('publicForm', PUBLIC_FORM_GQL, {
      input: { formId }
    })
    assert.strictEqual(publicForm.settings.active, true)
    assert.ok(
      publicForm.fields.some((f: any) => f.id === fieldId),
      'published field exposed'
    )

    const openToken = await respondent.gqlOk<string>('openForm', OPEN_FORM_GQL, {
      input: { formId }
    })
    assert.ok(openToken.length > 0)

    await respondent.gqlOk('completeSubmission', COMPLETE_SUBMISSION_GQL, {
      input: { formId, answers: {}, hiddenFields: [], openToken }
    })
  })

  test('admin exports submissions as CSV over a bodyless GET request', async () => {
    const { admin, formId } = need(state, ['admin', 'formId'])
    const result = await admin.client.restGet(
      `/api/export/submissions?formId=${encodeURIComponent(formId)}`
    )

    assert.strictEqual(result.status, 200, 'submission export should succeed')
    assert.match(
      result.headers.get('content-disposition') ?? '',
      /attachment; filename=".*\.csv"/,
      'response should download a CSV file'
    )
    assert.match(result.text, /What is your name\?/, 'CSV should contain the form field')
  })

  test('admin sees the submission in inbox, archives it, then deletes it', async () => {
    const { admin, formId } = need(state, ['admin', 'formId'])

    const inbox = await admin.client.gqlOk<any>('submissions', SUBMISSIONS_GQL, {
      input: { formId, category: 'inbox', page: 1, limit: 30 }
    })
    assert.strictEqual(inbox.total, 1, 'admin sees one inbox submission')
    const submissionId = inbox.submissions[0].id
    state.submissionId = submissionId

    const moved = await admin.client.gqlOk<boolean>(
      'updateSubmissionsCategory',
      UPDATE_SUBMISSIONS_CATEGORY_GQL,
      { input: { formId, submissionIds: [submissionId], category: 'archive' } }
    )
    assert.strictEqual(moved, true)

    const archived = await admin.client.gqlOk<any>('submissions', SUBMISSIONS_GQL, {
      input: { formId, category: 'archive', page: 1, limit: 30 }
    })
    assert.strictEqual(archived.total, 1)

    const deleted = await admin.client.gqlOk<boolean>('deleteSubmissions', DELETE_SUBMISSIONS_GQL, {
      input: { formId, submissionIds: [submissionId] }
    })
    assert.strictEqual(deleted, true)

    const after = await admin.client.gqlOk<any>('submissions', SUBMISSIONS_GQL, {
      input: { formId, category: 'archive', page: 1, limit: 30 }
    })
    assert.strictEqual(after.total, 0)
  })

  // ── Permission probes for non-admin roles ─────────────────────────────────
  // Project/form-scoped writes are open to any project member regardless of
  // role (the server's PermissionGuard only checks team/project membership,
  // not the team role). Owner-only resolvers like dissolveTeamCode explicitly
  // check `team.isOwner`, so those are what we probe here.
  test('collaborator can read forms but cannot request workspace deletion', async () => {
    const { collaborator, projectId, teamId, formId } = need(state, [
      'collaborator',
      'projectId',
      'teamId',
      'formId'
    ])

    const forms = await collaborator.client.gqlOk<any[]>('forms', FORMS_GQL, {
      input: { projectId, status: 1 }
    })
    assert.ok(
      forms.some(f => f.id === formId),
      'collaborator can list project forms'
    )

    const detail = await collaborator.client.gqlOk<any>('formDetail', FORM_DETAIL_GQL, {
      input: { formId }
    })
    assert.strictEqual(detail.id, formId, 'collaborator can read form detail')

    const result = await collaborator.client.gql('dissolveTeamCode', DISSOLVE_TEAM_CODE_GQL, {
      input: { teamId }
    })
    assert.ok(result.errors.length > 0, 'non-owner cannot request workspace dissolution')
  })

  test('member can read forms but cannot request project deletion', async () => {
    const { member, projectId, formId } = need(state, ['member', 'projectId', 'formId'])

    const forms = await member.client.gqlOk<any[]>('forms', FORMS_GQL, {
      input: { projectId, status: 1 }
    })
    assert.ok(
      forms.some(f => f.id === formId),
      'member can list project forms'
    )

    const result = await member.client.gql('deleteProjectCode', DELETE_PROJECT_CODE_GQL, {
      input: { projectId }
    })
    assert.ok(result.errors.length > 0, 'non-owner cannot request project deletion')
  })

  // ── Delete cascade: form → project → team ─────────────────────────────────
  test('admin trashes and hard-deletes the form', async () => {
    const { admin, formId, projectId } = need(state, ['admin', 'formId', 'projectId'])

    const trashed = await admin.client.gqlOk<boolean>('moveFormToTrash', MOVE_FORM_TO_TRASH_GQL, {
      input: { formId }
    })
    assert.strictEqual(trashed, true)

    const trashList = await admin.client.gqlOk<any[]>('forms', FORMS_GQL, {
      input: { projectId, status: 2 }
    })
    assert.ok(
      trashList.some(f => f.id === formId),
      'form is in TRASH'
    )

    const deleted = await admin.client.gqlOk<boolean>('deleteForm', DELETE_FORM_GQL, {
      input: { formId }
    })
    assert.strictEqual(deleted, true)

    const result = await admin.client.gql('formDetail', FORM_DETAIL_GQL, {
      input: { formId }
    })
    assert.ok(result.errors.length > 0, 'deleted form is not readable')
  })

  test('admin requests a code and deletes the project', async () => {
    const { admin, projectId, teamId } = need(state, ['admin', 'projectId', 'teamId'])

    const requested = await admin.client.gqlOk<boolean>(
      'deleteProjectCode',
      DELETE_PROJECT_CODE_GQL,
      { input: { projectId } }
    )
    assert.strictEqual(requested, true)

    const code = await readLatestVerificationCode(`verify_delete_project:${projectId}`)
    const deleted = await admin.client.gqlOk<boolean>('deleteProject', DELETE_PROJECT_GQL, {
      input: { projectId, code }
    })
    assert.strictEqual(deleted, true)

    const teams = await admin.client.gqlOk<any[]>('teams', TEAMS_GQL)
    const team = teams.find(t => t.id === teamId)
    assert.ok(team, 'team itself still exists')
    assert.ok(
      !team.projects.some((p: any) => p.id === projectId),
      'deleted project no longer listed'
    )
  })

  test('admin requests a code and dissolves the workspace', async () => {
    const { admin, teamId } = need(state, ['admin', 'teamId'])

    const requested = await admin.client.gqlOk<boolean>(
      'dissolveTeamCode',
      DISSOLVE_TEAM_CODE_GQL,
      { input: { teamId } }
    )
    assert.strictEqual(requested, true)

    const code = await readLatestVerificationCode(`verify_dissolve_team:${teamId}`)
    const dissolved = await admin.client.gqlOk<boolean>('dissolveTeam', DISSOLVE_TEAM_GQL, {
      input: { teamId, code }
    })
    assert.strictEqual(dissolved, true)

    const teams = await admin.client.gqlOk<any[]>('teams', TEAMS_GQL)
    assert.ok(!teams.some(t => t.id === teamId), 'admin no longer sees dissolved workspace')
  })

  test('collaborator and member no longer see the dissolved workspace', async () => {
    const { collaborator, member, teamId } = need(state, ['collaborator', 'member', 'teamId'])
    const collabTeams = await collaborator.client.gqlOk<any[]>('teams', TEAMS_GQL)
    assert.ok(!collabTeams.some(t => t.id === teamId))

    const memberTeams = await member.client.gqlOk<any[]>('teams', TEAMS_GQL)
    assert.ok(!memberTeams.some(t => t.id === teamId))
  })

  return suite
}
