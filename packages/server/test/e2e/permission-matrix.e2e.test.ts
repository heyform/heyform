import * as assert from 'assert'

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

const ROLE_COLLABORATOR = 2
const ROLE_MEMBER = 3

const CALLERS = [
  'admin', // ADMIN, in team, in project
  'collaborator', // COLLABORATOR (joined via invite), in team, in project
  'member', // MEMBER (seeded), in team, in project
  'teamOnly', // COLLABORATOR (seeded), in team, NOT in project
  'outsider', // signed-up user, not in any team
  'anonymous' // no session at all
] as const
type Caller = (typeof CALLERS)[number]

type Outcome = 'ok' | 'error'
type ExpectedMap = Record<Caller, Outcome>

interface MatrixSpec {
  /** GraphQL operationName — also used as the test title prefix */
  op: string
  query: string
  /** Build variables from the shared setup context. */
  buildVars: (ctx: MatrixContext) => Record<string, any>
  expected: ExpectedMap
}

interface MatrixContext {
  admin: SignedUpUser
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
  switch (caller) {
    case 'admin':
      return ctx.admin.client
    case 'collaborator':
      return ctx.collaborator.client
    case 'member':
      return ctx.member.client
    case 'teamOnly':
      return ctx.teamOnly.client
    case 'outsider':
      return ctx.outsider.client
    case 'anonymous':
      return ctx.anonymous
  }
}

/**
 * Programmatic permission matrix.
 *
 * One setup phase signs up four named roles (admin/collab/member/teamOnly)
 * plus an outsider, builds a workspace+project+published form, and shares the
 * context with every probe. Each probe is one GraphQL operation; the matrix
 * runs that operation as every caller and asserts pass/fail per
 * `spec.expected`. The expected map is built from reading the resolvers — when
 * a resolver checks `team.isOwner`, only admin gets `ok`; otherwise any
 * team/project member gets through.
 */
export function build(baseUrl: string) {
  const { suite, test } = defineSuite('permission matrix')
  let ctx: MatrixContext

  test('setup: provision admin/collab/member/teamOnly/outsider + workspace+project+form', async () => {
    const admin = await signUpUser(baseUrl, { name: uniqueName('Admin') })
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

    // member + teamOnly are seeded directly (no public role mutation exists)
    await seedTeamMember({ teamId, memberId: member.id, role: ROLE_MEMBER })
    await seedTeamMember({ teamId, memberId: teamOnly.id, role: ROLE_COLLABORATOR })

    // Admin makes a dedicated project, adds collab/member, leaves teamOnly out
    const projectId = await admin.client.gqlOk<string>('createProject', CREATE_PROJECT_GQL, {
      input: {
        teamId,
        name: uniqueName('Matrix Project'),
        memberIds: [collaborator.id, member.id]
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
      expected: ok({ admin: 'ok', otherwise: 'error' })
    },
    {
      op: 'inviteMember',
      query: INVITE_MEMBER_GQL,
      buildVars: c => ({ input: { teamId: c.teamId, emails: [uniqueEmail('invitee-')] } }),
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
    for (const caller of CALLERS) {
      const expected = spec.expected[caller]
      test(`${spec.op} — ${caller} (${expected})`, async () => {
        if (!ctx) throw new Error('matrix setup did not run')
        const client = clientFor(ctx, caller)
        const variables = spec.buildVars(ctx)
        const result = await client.gql(spec.op, spec.query, variables)
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
    }
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
