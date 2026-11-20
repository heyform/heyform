import assert from 'assert'

import { E2EClient } from './helpers/client'
import { SignedUpUser, signUpUser } from './helpers/fixtures'
import {
  APPS_GQL,
  CREATE_BRAND_KIT_GQL,
  CREATE_FORM_GQL,
  CREATE_PROJECT_GQL,
  CREATE_TEAM_GQL,
  DELETE_PROJECT_CODE_GQL,
  DISSOLVE_TEAM_CODE_GQL,
  DUPLICATE_FORM_GQL,
  FORMS_GQL,
  FORM_ANALYTIC_GQL,
  FORM_DETAIL_GQL,
  FORM_INTEGRATIONS_GQL,
  FORM_REPORT_GQL,
  INVITE_MEMBER_GQL,
  JOIN_TEAM_GQL,
  OPEN_FORM_GQL,
  PUBLIC_FORM_GQL,
  PUBLIC_TEAM_DETAIL_GQL,
  PUBLISH_FORM_GQL,
  RENAME_PROJECT_GQL,
  RESET_TEAM_INVITE_CODE_GQL,
  SEARCH_FORMS_GQL,
  SEARCH_TEAM_GQL,
  SUBMISSIONS_GQL,
  TEAMS_GQL,
  TEAM_MEMBERS_GQL,
  TEAM_OVERVIEW_GQL,
  TEAM_RECENT_FORMS_GQL,
  TEMPLATES_GQL,
  TEMPLATE_DETAIL_GQL,
  UPDATE_FORM_ARCHIVE_GQL,
  UPDATE_FORM_GQL,
  UPDATE_FORM_HIDDEN_FIELDS_GQL,
  UPDATE_FORM_LOGICS_GQL,
  UPDATE_FORM_SCHEMAS_GQL,
  UPDATE_FORM_THEME_GQL,
  UPDATE_FORM_VARIABLES_GQL,
  UPDATE_TEAM_GQL,
  UPDATE_USER_GQL,
  USER_DETAIL_GQL
} from './helpers/gql'
import { randomString, uniqueEmail, uniqueName } from './helpers/random'
import { defineSuite } from './helpers/runner'
import { seedProjectMember, seedTeamMember } from './helpers/seed'

const ROLE_ADMIN = 1
const ROLE_COLLABORATOR = 2
const ROLE_MEMBER = 3

const CALLERS = [
  'admin', // workspace owner, in project
  'workspaceAdmin', // ADMIN, not the owner, in project
  'collaborator', // COLLABORATOR (joined via invite), in team, in project
  'member', // MEMBER (seeded), in team, in project
  'teamOnly', // COLLABORATOR (seeded), in team, NOT in project
  'outsider', // belongs to a different workspace
  'anonymous' // no session at all
] as const
type Caller = (typeof CALLERS)[number]

type Outcome = 'ok' | 'error'
type ExpectedMap = Record<Caller, Outcome>
type Variables = Record<string, any>

interface RestRequest {
  method: 'GET' | 'POST' | 'PATCH'
  path: string
  body?: unknown
}

interface AccountKey {
  id: string
  token: string
}

interface MatrixSpec {
  /** GraphQL operationName — also used as the test title prefix */
  op: string
  query: string
  /** Build variables from the shared setup context. */
  buildVars: (ctx: MatrixContext) => Variables
  expected: ExpectedMap
  rest?: (ctx: MatrixContext, variables: Variables) => RestRequest
}

interface MatrixContext {
  admin: SignedUpUser
  workspaceAdmin: SignedUpUser
  collaborator: SignedUpUser
  member: SignedUpUser
  teamOnly: SignedUpUser
  outsider: SignedUpUser
  anonymous: E2EClient
  teamId: string
  inviteCode: string
  projectId: string
  formId: string
  fieldId: string
}

function clientFor(ctx: MatrixContext, caller: Caller): E2EClient {
  return caller === 'anonymous' ? ctx.anonymous : ctx[caller].client
}

/**
 * Programmatic permission matrix.
 *
 * Fixtures share a workspace, project and published form. Each GraphQL probe
 * checks the expected role outcome. Paired REST probes use the same caller's
 * account key and compare the observed GraphQL outcome with the REST status.
 */
export function build(baseUrl: string) {
  const { suite, test } = defineSuite('permission matrix')
  const restClient = new E2EClient({ baseUrl })
  const keys = new Map<Caller, AccountKey>()
  let ctx: MatrixContext

  test('setup: provision workspace roles, an outsider, a project and a published form', async () => {
    const admin = await signUpUser(baseUrl, { name: uniqueName('Admin') })
    const workspaceAdmin = await signUpUser(baseUrl, { name: uniqueName('Workspace Admin') })
    const collaborator = await signUpUser(baseUrl, { name: uniqueName('Collab') })
    const member = await signUpUser(baseUrl, { name: uniqueName('Member') })
    const teamOnly = await signUpUser(baseUrl, { name: uniqueName('TeamOnly') })
    const outsider = await signUpUser(baseUrl, { name: uniqueName('Outsider') })
    const anonymous = new E2EClient({ baseUrl })

    const teamId = await admin.client.gqlOk<string>('createTeam', CREATE_TEAM_GQL, {
      input: { name: uniqueName('Matrix WS'), projectName: uniqueName('Matrix Seed') }
    })
    const teams = await admin.client.gqlOk<any[]>('teams', TEAMS_GQL)
    const team = teams.find(t => t.id === teamId)
    if (!team) throw new Error('admin cannot see the team they just created')
    const inviteCode = team.inviteCode

    // collaborator joins via the public flow
    await collaborator.client.gqlOk<boolean>('joinTeam', JOIN_TEAM_GQL, {
      input: { teamId, inviteCode }
    })

    // Seed non-owner roles directly so they exercise the real production guards.
    await seedTeamMember({ teamId, memberId: workspaceAdmin.id, role: ROLE_ADMIN })
    await seedTeamMember({ teamId, memberId: member.id, role: ROLE_MEMBER })
    await seedTeamMember({ teamId, memberId: teamOnly.id, role: ROLE_COLLABORATOR })

    // Admin makes a dedicated project, adds collab/member, leaves teamOnly out
    const projectId = await admin.client.gqlOk<string>('createProject', CREATE_PROJECT_GQL, {
      input: {
        teamId,
        name: uniqueName('Matrix Project'),
        memberIds: [workspaceAdmin.id, collaborator.id, member.id]
      }
    })
    await seedProjectMember({ projectId, memberId: collaborator.id })
    await seedProjectMember({ projectId, memberId: member.id })

    const formId = await admin.client.gqlOk<string>('createForm', CREATE_FORM_GQL, {
      input: { projectId, name: uniqueName('Matrix Form'), interactiveMode: 1, kind: 1 }
    })

    const detail = await admin.client.gqlOk<any>('formDetail', FORM_DETAIL_GQL, {
      input: { formId }
    })
    const fieldId = `f_${randomString(10)}`
    const drafts = [
      { id: fieldId, kind: 'short_text', title: ['Name?'], validations: { required: false } },
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
    await admin.client.gqlOk<boolean>('publishForm', PUBLISH_FORM_GQL, {
      input: { formId, drafts, version: updated.version }
    })

    ctx = {
      admin,
      workspaceAdmin,
      collaborator,
      member,
      teamOnly,
      outsider,
      anonymous,
      teamId,
      inviteCode,
      projectId,
      formId,
      fieldId
    }
  })

  const keyCallers = CALLERS.filter(caller => caller !== 'anonymous')
  for (const caller of keyCallers) {
    test(`REST setup — issue an account key for ${caller}`, async () => {
      assert.ok(ctx, 'matrix setup did not run')
      const session = clientFor(ctx, caller)
      const workspaceId =
        caller === 'outsider'
          ? await session.gqlOk<string>('createTeam', CREATE_TEAM_GQL, {
              input: { name: uniqueName('Matrix Outsider'), projectName: 'Default' }
            })
          : ctx.teamId
      const access = await session.accountKeys<{
        workspaces: Array<{ id: string; scopes: string[] }>
      }>('GET')
      assert.strictEqual(access.status, 200, 'account key settings should be available')
      const workspace = access.body.workspaces.find(workspace => workspace.id === workspaceId)
      assert.ok(workspace?.scopes.length, 'the caller needs at least one permitted scope')
      const issued = await session.accountKeys<AccountKey>('POST', '', {
        name: 'Permission matrix',
        workspaceAccess: 'selected',
        workspaceIds: [workspaceId],
        scopes: workspace.scopes
      })
      assert.strictEqual(issued.status, 201, 'scoped key should be issued')
      assert.ok(issued.body.id && issued.body.token, 'account key credentials are required')
      keys.set(caller, issued.body)
    })
  }

  // ─── Probe order is intentional: read-only first, then ops that change ───
  // shared state (e.g. resetTeamInviteCode rotates the invite code; we only
  // depend on `ctx.inviteCode` for `publicTeamDetail`, which runs earlier).
  const SPECS: MatrixSpec[] = [
    // ── 1. Truly public — anonymous + everyone ───────────────────────────
    {
      op: 'apps',
      query: APPS_GQL,
      buildVars: () => ({}),
      expected: ok({ all: 'ok' })
    },
    {
      op: 'publicForm',
      query: PUBLIC_FORM_GQL,
      buildVars: c => ({ input: { formId: c.formId } }),
      expected: ok({ all: 'ok' })
    },
    {
      op: 'publicTeamDetail',
      query: PUBLIC_TEAM_DETAIL_GQL,
      buildVars: c => ({ input: { teamId: c.teamId, inviteCode: c.inviteCode } }),
      expected: ok({ all: 'ok' })
    },
    {
      op: 'openForm',
      query: OPEN_FORM_GQL,
      buildVars: c => ({ input: { formId: c.formId } }),
      expected: ok({ all: 'ok' })
    },

    // ── 2. Authenticated, no team context ────────────────────────────────
    {
      op: 'userDetail',
      query: USER_DETAIL_GQL,
      buildVars: () => ({}),
      expected: ok({ all: 'ok', anonymous: 'error' })
    },
    {
      op: 'updateUser',
      query: UPDATE_USER_GQL,
      buildVars: () => ({ input: { name: uniqueName('Renamed') } }),
      expected: ok({ all: 'ok', anonymous: 'error' })
    },
    {
      op: 'teams',
      query: TEAMS_GQL,
      buildVars: () => ({}),
      rest: () => ({ method: 'GET', path: '/workspaces' }),
      expected: ok({ all: 'ok', anonymous: 'error' })
    },
    {
      op: 'templates',
      query: TEMPLATES_GQL,
      buildVars: () => ({}),
      expected: ok({ all: 'ok', anonymous: 'error' })
    },
    // searchForms is currently broken server-side: the resolver carries a
    // `@TeamGuard()` decorator but `SearchFormInput` has no teamId field, so
    // the guard rejects every caller. The probe is included here so the
    // matrix locks the actual behaviour — drop the row when the bug is fixed.
    {
      op: 'searchForms',
      query: SEARCH_FORMS_GQL,
      buildVars: () => ({ input: { keyword: `no-such-${randomString(6)}` } }),
      expected: ok({ all: 'error' })
    },
    // Missing templates must not expose data to any caller.
    {
      op: 'templateDetail',
      query: TEMPLATE_DETAIL_GQL,
      buildVars: () => ({ input: { templateSlug: 'no-such-template' } }),
      expected: ok({ all: 'error' })
    },

    // ── 3. Team-scoped reads — team members only ─────────────────────────
    {
      op: 'teamMembers',
      query: TEAM_MEMBERS_GQL,
      buildVars: c => ({ input: { teamId: c.teamId } }),
      rest: c => ({ method: 'GET', path: `/workspaces/${c.teamId}/members` }),
      expected: ok({ all: 'ok', outsider: 'error', anonymous: 'error' })
    },
    {
      op: 'teamOverview',
      query: TEAM_OVERVIEW_GQL,
      buildVars: c => ({ input: { teamId: c.teamId } }),
      expected: ok({ all: 'ok', outsider: 'error', anonymous: 'error' })
    },
    {
      op: 'teamRecentForms',
      query: TEAM_RECENT_FORMS_GQL,
      buildVars: c => ({ input: { teamId: c.teamId, limit: 5 } }),
      expected: ok({ all: 'ok', outsider: 'error', anonymous: 'error' })
    },
    {
      op: 'searchTeam',
      query: SEARCH_TEAM_GQL,
      buildVars: c => ({ input: { teamId: c.teamId, query: 'matrix' } }),
      expected: ok({ all: 'ok', outsider: 'error', anonymous: 'error' })
    },
    // Idempotent team-scoped writes (any team member, no isOwner check).
    {
      op: 'createBrandKit',
      query: CREATE_BRAND_KIT_GQL,
      buildVars: c => ({
        input: {
          teamId: c.teamId,
          logo: 'https://example.com/logo.png',
          theme: { primary: '#000000' }
        }
      }),
      expected: ok({ all: 'ok', outsider: 'error', anonymous: 'error' })
    },

    // ── 4. Project-scoped — project members only (teamOnly is excluded) ──
    {
      op: 'forms',
      query: FORMS_GQL,
      buildVars: c => ({ input: { projectId: c.projectId, status: 1 } }),
      rest: c => ({ method: 'GET', path: `/projects/${c.projectId}/forms` }),
      expected: ok({
        all: 'ok',
        teamOnly: 'error',
        outsider: 'error',
        anonymous: 'error'
      })
    },
    {
      op: 'formDetail',
      query: FORM_DETAIL_GQL,
      buildVars: c => ({ input: { formId: c.formId } }),
      rest: c => ({ method: 'GET', path: `/forms/${c.formId}` }),
      expected: ok({
        all: 'ok',
        teamOnly: 'error',
        outsider: 'error',
        anonymous: 'error'
      })
    },
    {
      op: 'formAnalytic',
      query: FORM_ANALYTIC_GQL,
      buildVars: c => ({ input: { formId: c.formId, range: '7d' } }),
      expected: ok({
        all: 'ok',
        teamOnly: 'error',
        outsider: 'error',
        anonymous: 'error'
      })
    },
    {
      op: 'formIntegrations',
      query: FORM_INTEGRATIONS_GQL,
      buildVars: c => ({ input: { formId: c.formId } }),
      expected: ok({
        all: 'ok',
        teamOnly: 'error',
        outsider: 'error',
        anonymous: 'error'
      })
    },
    {
      op: 'updateForm',
      query: UPDATE_FORM_GQL,
      buildVars: c => ({
        input: { formId: c.formId, filterSpam: true, enableProgress: true, locale: 'en' }
      }),
      rest: (c, { input: { filterSpam, enableProgress, locale } }) => ({
        method: 'PATCH',
        path: `/forms/${c.formId}/settings`,
        body: { filterSpam, enableProgress, locale }
      }),
      expected: ok({
        all: 'ok',
        teamOnly: 'error',
        outsider: 'error',
        anonymous: 'error'
      })
    },
    {
      op: 'submissions',
      query: SUBMISSIONS_GQL,
      buildVars: c => ({
        input: { formId: c.formId, category: 'inbox', page: 1, limit: 30 }
      }),
      rest: (c, { input: { page, limit } }) => ({
        method: 'GET',
        path: `/forms/${c.formId}/submissions?page=${page}&limit=${limit}`
      }),
      expected: ok({
        all: 'ok',
        teamOnly: 'error',
        outsider: 'error',
        anonymous: 'error'
      })
    },
    {
      op: 'formReport',
      query: FORM_REPORT_GQL,
      buildVars: c => ({ input: { formId: c.formId } }),
      expected: ok({
        all: 'ok',
        teamOnly: 'error',
        outsider: 'error',
        anonymous: 'error'
      })
    },
    {
      op: 'renameProject',
      query: RENAME_PROJECT_GQL,
      buildVars: c => ({
        input: { projectId: c.projectId, name: uniqueName('Matrix Project') }
      }),
      rest: (c, { input: { name } }) => ({
        method: 'PATCH',
        path: `/projects/${c.projectId}`,
        body: { name }
      }),
      expected: ok({
        all: 'ok',
        teamOnly: 'error',
        outsider: 'error',
        anonymous: 'error'
      })
    },
    // Form-scoped writes — idempotent payloads to keep ordering safe.
    {
      op: 'updateFormLogics',
      query: UPDATE_FORM_LOGICS_GQL,
      buildVars: c => ({ input: { formId: c.formId, logics: [] } }),
      expected: ok({
        all: 'ok',
        teamOnly: 'error',
        outsider: 'error',
        anonymous: 'error'
      })
    },
    {
      op: 'updateFormVariables',
      query: UPDATE_FORM_VARIABLES_GQL,
      buildVars: c => ({ input: { formId: c.formId, variables: [] } }),
      rest: (c, { input: { variables } }) => ({
        method: 'PATCH',
        path: `/forms/${c.formId}/variables`,
        body: { variables }
      }),
      expected: ok({
        all: 'ok',
        teamOnly: 'error',
        outsider: 'error',
        anonymous: 'error'
      })
    },
    {
      op: 'updateFormHiddenFields',
      query: UPDATE_FORM_HIDDEN_FIELDS_GQL,
      buildVars: c => ({ input: { formId: c.formId, hiddenFields: [] } }),
      rest: (c, { input: { hiddenFields } }) => ({
        method: 'PATCH',
        path: `/forms/${c.formId}/hidden-fields`,
        body: { hiddenFields }
      }),
      expected: ok({
        all: 'ok',
        teamOnly: 'error',
        outsider: 'error',
        anonymous: 'error'
      })
    },
    {
      op: 'updateFormArchive',
      query: UPDATE_FORM_ARCHIVE_GQL,
      buildVars: c => ({ input: { formId: c.formId, allowArchive: true } }),
      rest: (c, { input: { allowArchive } }) => ({
        method: 'PATCH',
        path: `/forms/${c.formId}/settings`,
        body: { allowArchive }
      }),
      expected: ok({
        all: 'ok',
        teamOnly: 'error',
        outsider: 'error',
        anonymous: 'error'
      })
    },
    {
      op: 'updateFormTheme',
      query: UPDATE_FORM_THEME_GQL,
      buildVars: c => ({
        input: { formId: c.formId, theme: { fontFamily: 'sans-serif' } }
      }),
      rest: (c, { input: { theme } }) => ({
        method: 'PATCH',
        path: `/forms/${c.formId}/theme`,
        body: { theme }
      }),
      expected: ok({
        all: 'ok',
        teamOnly: 'error',
        outsider: 'error',
        anonymous: 'error'
      })
    },
    // duplicateForm produces a fresh form per call — we don't track the clones
    // (they live on as orphan test data, scrubbed by `docker compose down -v`).
    {
      op: 'duplicateForm',
      query: DUPLICATE_FORM_GQL,
      buildVars: c => ({
        input: { formId: c.formId, name: uniqueName('Matrix Clone') }
      }),
      rest: (c, { input: { name } }) => ({
        method: 'POST',
        path: `/forms/${c.formId}/duplicate`,
        body: { name }
      }),
      expected: ok({
        all: 'ok',
        teamOnly: 'error',
        outsider: 'error',
        anonymous: 'error'
      })
    },

    // ── 5. Owner-only (every resolver below explicitly checks isOwner) ───
    {
      op: 'updateTeam',
      query: UPDATE_TEAM_GQL,
      buildVars: c => ({ input: { teamId: c.teamId, name: uniqueName('Renamed') } }),
      rest: (c, { input: { name } }) => ({
        method: 'PATCH',
        path: `/workspaces/${c.teamId}`,
        body: { name }
      }),
      expected: ok({ admin: 'ok', otherwise: 'error' })
    },
    {
      op: 'inviteMember',
      query: INVITE_MEMBER_GQL,
      buildVars: c => ({ input: { teamId: c.teamId, emails: [uniqueEmail('invitee-')] } }),
      rest: (c, { input: { emails } }) => ({
        method: 'POST',
        path: `/workspaces/${c.teamId}/invitations`,
        body: { emails }
      }),
      expected: ok({ admin: 'ok', otherwise: 'error' })
    },
    {
      op: 'dissolveTeamCode',
      query: DISSOLVE_TEAM_CODE_GQL,
      buildVars: c => ({ input: { teamId: c.teamId } }),
      expected: ok({ admin: 'ok', otherwise: 'error' })
    },
    {
      op: 'deleteProjectCode',
      query: DELETE_PROJECT_CODE_GQL,
      buildVars: c => ({ input: { projectId: c.projectId } }),
      expected: ok({ admin: 'ok', otherwise: 'error' })
    },
    // resetTeamInviteCode rotates the invite code on success, so park it LAST
    // among the owner-only probes; nothing afterwards depends on inviteCode.
    {
      op: 'resetTeamInviteCode',
      query: RESET_TEAM_INVITE_CODE_GQL,
      buildVars: c => ({ input: { teamId: c.teamId } }),
      expected: ok({ admin: 'ok', otherwise: 'error' })
    }
  ]

  for (const spec of SPECS) {
    // Keep the original role matrix for GraphQL-only operations. The extra
    // non-owner ADMIN case checks authorization parity where a REST route exists.
    const callers = spec.rest ? CALLERS : CALLERS.filter(caller => caller !== 'workspaceAdmin')
    for (const caller of callers) {
      const expected = spec.expected[caller]
      let observed: { variables: Variables; allowed: boolean }
      test(`${spec.op} — ${caller} (${expected})`, async () => {
        if (!ctx) throw new Error('matrix setup did not run')
        const client = clientFor(ctx, caller)
        const variables = spec.buildVars(ctx)
        const result = await client.gql(spec.op, spec.query, variables)
        observed = { variables, allowed: result.errors.length === 0 && result.status < 400 }
        if (expected === 'ok') {
          assert.strictEqual(
            result.errors.length,
            0,
            `expected ${spec.op} to succeed for ${caller}; got: ${summarise(result.errors)}`
          )
        } else {
          assert.ok(
            result.errors.length > 0,
            `expected ${spec.op} to fail for ${caller}; got data: ${JSON.stringify(result.data)?.slice(0, 200)}`
          )
        }
      })

      if (spec.rest) {
        test(`REST parity — ${spec.op} — ${caller}`, async () => {
          assert.ok(observed, 'GraphQL probe did not return an outcome')
          const key = keys.get(caller)
          if (caller !== 'anonymous') assert.ok(key, 'REST setup did not issue a key')

          const { method, path, body } = spec.rest(ctx, observed.variables)
          const response = await restClient.restJson(
            method,
            '/api/v1' + path,
            body,
            key ? { authorization: `Bearer ${key.token}` } : {}
          )
          const status = observed.allowed ? (method === 'POST' ? 201 : 200) : key ? 403 : 401
          assert.strictEqual(
            response.status,
            status,
            `${method} ${path} disagrees with GraphQL authorization for ${caller}: ${response.body?.message ?? ''}`
          )
          assert.match(response.headers.get('content-type') ?? '', /^application\/json\b/)
        })
      }
    }
  }

  for (const caller of keyCallers) {
    test(`REST cleanup — delete the account key for ${caller}`, async () => {
      const key = keys.get(caller)
      if (key) {
        const response = await clientFor(ctx, caller).accountKeys('DELETE', '/' + key.id)
        assert.strictEqual(response.status, 200, 'matrix key should be deleted')
      }
    })
  }

  return suite
}

/**
 * Tiny DSL for expected-outcome maps so the SPECS table stays readable.
 *
 * Examples:
 *   ok({ all: 'ok' })                                       — everyone passes
 *   ok({ all: 'ok', anonymous: 'error' })                   — auth required
 *   ok({ all: 'ok', teamOnly: 'error', outsider: 'error', anonymous: 'error' })
 *   ok({ admin: 'ok', otherwise: 'error' })                 — owner-only
 */
function ok(
  shape: Partial<Record<Caller, Outcome>> & {
    all?: Outcome
    otherwise?: Outcome
  }
): ExpectedMap {
  const fallback: Outcome = shape.all ?? shape.otherwise ?? 'error'
  const out = {} as ExpectedMap
  for (const c of CALLERS) {
    out[c] = (shape as any)[c] ?? fallback
  }
  return out
}

function summarise(errors: any[]): string {
  if (!errors?.length) return '(no errors)'
  return errors
    .map(e => {
      const code = e.extensions?.code ?? '?'
      return `${e.message} [${code}]`
    })
    .join('; ')
}
