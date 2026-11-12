# Server E2E Tests

End-to-end tests for the HeyForm NestJS server. They drive a running instance
over HTTP/GraphQL using the **same surface** the webapp talks to
(`X-Device-Id` header + cookie session + Apollo-style JSON POSTs to
`/graphql`).

> The suite requires a running server backed by **MongoDB** and **Redis/KeyDB**.
> These are not unit tests — they exercise real infrastructure.

## Layout

```
packages/server/test/e2e/
├── run.ts                                 # Entry point — wires suites in order
├── helpers/
│   ├── client.ts                          # E2EClient: cookie jar + fetch + GraphQL
│   ├── fixtures.ts                        # signUpUser (returns a client + id)
│   ├── gql.ts                             # GraphQL ops mirrored from the webapp
│   ├── random.ts                          # uniqueEmail / strongPassword / deviceId
│   ├── runner.ts                          # defineSuite + runSuites
│   ├── seed.ts                            # Direct mongo writes (MEMBER role, project member)
│   ├── verification.ts                    # Read latest verification code from Redis
│   └── wait.ts                            # waitForReady(/health/ready)
├── auth.e2e.test.ts                       # sign-up, login, logout, deviceId guard
├── auth-flows.e2e.test.ts                 # password rotation, reset-via-code, membership revocation
├── catalog.e2e.test.ts                    # apps (public), templates (auth)
├── health.e2e.test.ts                     # /health, /health/ready
├── input-validation.e2e.test.ts           # length caps, enum checks, missing-field guards
├── permission-matrix.e2e.test.ts          # role-based permission matrix (programmatic)
├── rate-limit.e2e.test.ts                 # login lockout, code-resend cooldown (LAST)
├── stateful-edges.e2e.test.ts             # version, trash/restore, cross-team, invite/ownership
├── team-flow.e2e.test.ts                  # stateful admin/COLLABORATOR/MEMBER lifecycle
└── scripts/
    └── run-with-docker.js                 # docker compose wrapper
```

## Running

### Option A — against an already-running server

```bash
# Bring the stack up
docker compose -f docker-compose.test.yml up -d

# Then run the suite (from repo root)
pnpm --filter ./packages/server run test:e2e
```

The runner targets `http://localhost:9157` (the port published by
`docker-compose.test.yml`). Override with `E2E_BASE_URL`.

The runner loads `packages/server/.env`, so `MONGO_URI` and `REDIS_*` from that
file apply. If the file doesn't match the target server (for example, the docker
stack above), export `E2E_MONGO_URI` and `E2E_REDIS_PORT`, which take priority.

### Option B — bring the stack up and tear it down around the run

```bash
pnpm --filter ./packages/server run test:e2e:docker
```

This calls `docker compose -f docker-compose.test.yml up -d --build heyform`,
waits for `/health/ready`, runs the tests, then `docker compose down -v`.
Pass `E2E_KEEP_UP=1` to keep the stack running afterwards.

### Option C — CI (GitHub Actions)

`.github/workflows/server-e2e.yml` runs on every pull request and push targeting
`next` or `main`, and on merge-queue events. It uses Node 22 and pnpm 9 and runs
shared-library, renderer, webapp and server unit tests, server type-checking,
the production build, and HTTP/GraphQL E2E tests. Server logs are printed on failure.
There are no path filters, so documentation-only PRs also produce the check.

The active [Required regression tests ruleset](https://github.com/heyform/heyform/rules/27085044)
requires the GitHub Actions check `HTTP/GraphQL e2e suite` for `next` and `main`,
with branches required to be up to date and no bypass actors. A workflow alone
does not prevent merging failed checks; forks need to configure this requirement
in their own GitHub repository settings.

### Unit regression coverage

The server unit runner automatically discovers every `test/*.test.ts` file and
runs each in a separate process. New files need no manual registration. Nested
`test/e2e` suites remain in the E2E runner because they require a live server.
The frontend upload, form-presentation, and theme regression files are registered
Vitest suites and are no longer excluded from discovery.

The management suites cover workspace ownership transfer, invitations, member
removal and leaving, project membership and cross-workspace isolation, form
publishing and stale versions, duplication, trash/restore, submission deletion
and filtering, and input-validation boundaries. The workspace fixture replaces
persistence and external services while exercising the real resolvers and
permission guard; it does not substitute for the HTTP/database suites.

Deletion regressions explicitly check that live or concurrently restored forms
keep their responses, expired forms lose their responses, and failed deletions
never trigger response cleanup. The HTTP suite also submits a real response
before attempting to delete a live form.

Run these tests after building shared dependencies:

```bash
pnpm build:shared
pnpm --filter ./packages/server test:unit
```

Before the first run, populate `.env` in the repo root:

```env
SESSION_KEY=<32-char random>
FORM_ENCRYPTION_KEY=<32-char random>
APP_HOMEPAGE_URL=http://localhost:9157
```

## Environment variables

| Variable           | Default                                | Purpose                                                  |
| ------------------ | -------------------------------------- | -------------------------------------------------------- |
| `E2E_BASE_URL`     | `http://localhost:9157`                | Target server.                                           |
| `E2E_SKIP_WAIT`    | _unset_                                | Skip the `/health/ready` probe before running suites.    |
| `E2E_WAIT_MS`      | `60000`                                | Max wait for readiness.                                  |
| `E2E_ONLY`         | _unset_                                | Comma-separated suite names to run (e.g. `team,matrix`). |
| `E2E_KEEP_UP`      | _unset_                                | `1` leaves the docker stack running (docker mode only).  |
| `E2E_MONGO_URI`    | `mongodb://127.0.0.1:27018/heyform`    | Direct-mongo seed for `helpers/seed.ts`.                 |
| `E2E_REDIS_HOST`   | `127.0.0.1`                            | Used by `helpers/verification.ts`.                       |
| `E2E_REDIS_PORT`   | `9514`                                 | KeyDB port exposed by `docker-compose.test.yml`.         |

`docker-compose.test.yml` publishes mongo on `27018:27017` and keydb on
`9514:6379` so the helpers can reach them from the host.

## Suite-by-suite breakdown (run order)

| Order | Suite                | Approx. cases | What it covers                                                                                       |
| ----- | -------------------- | -------------:| ---------------------------------------------------------------------------------------------------- |
| 1     | `health`             | 2             | `/health`, `/health/ready` reports mongo + redis up.                                                 |
| 2     | `auth`               | 9             | DeviceId guard, sign-up (cookies, `userDetail`), duplicate-email, weak password, login Query, wrong password, missing account, unauthenticated `userDetail`, `/logout`. |
| 3     | `catalog`            | 3             | `apps` (public), `templates` (auth-only), unauthenticated `templates` rejected.                      |
| 4     | `input validation`   | 16            | Empty/oversize names, malformed emails, missing required fields, invalid enum values, weak password. |
| 5     | `auth flows`         | 7             | `updateUserPassword` rotation + wrong-currentPassword + weak-newPassword, `sendResetPasswordEmail`+`resetPassword` end-to-end (code read from Redis), session retained after `removeTeamMember` but team scope lost. |
| 6     | `stateful edges`     | 13            | Stale-version rejection on `updateFormSchemas`/`publishForm`, idempotent double-trash, `restoreForm` on NORMAL form is a no-op, **`deleteForm` returns true even on NORMAL form (server bug)**, cross-team `formDetail`/`forms` leakage forbidden, `joinTeam` failures (wrong code / already joined / rotated code), `leaveTeam` blocks the owner, `removeTeamMember` refuses the owner, `transferTeam` to non-member rejected, `openForm` on unpublished form, `completeSubmission` with bad `openToken`. |
| 7     | `team flow`          | 15            | Stateful admin → COLLABORATOR (joins by invite) → MEMBER (seeded) → workspace → project → form → publish → submit → archive → delete form → delete project → dissolve team. Cookies reused; no re-auth. |
| 8     | `permission matrix`  | 205           | Programmatic table: each GraphQL op × six callers (admin/collaborator/member/teamOnly/outsider/anonymous). Asserts pass/fail against actual resolver behaviour. ~34 operations covered. |
| 9     | `rate limit`         | 3             | Login locks the user out after 5 wrong passwords (15-min window); `sendResetPasswordEmail` 60s per-user cooldown. Runs **last** because it burns per-user attempt counters. |

**Total: ~276 cases, completes in ≈ 6s** against a warm dockerised stack.

### Caller identities in `permission matrix`

| Caller         | In team?     | Team role        | In project?  |
| -------------- | ------------ | ---------------- | ------------ |
| `admin`        | yes          | `ADMIN`          | yes (owner)  |
| `collaborator` | yes (joined) | `COLLABORATOR`   | yes (added)  |
| `member`       | yes (seeded) | `MEMBER`         | yes (added)  |
| `teamOnly`     | yes (seeded) | `COLLABORATOR`   | **no**       |
| `outsider`     | no           | _n/a_            | no           |
| `anonymous`    | no session   | _n/a_            | no           |

#### Ops probed by the matrix

- **Public** (anyone, no session needed): `apps`, `publicForm`, `publicTeamDetail`, `openForm`.
- **Auth-only** (any signed-in user, no team context): `userDetail`, `updateUser`, `teams`, `templates`.
- **Team-scoped reads** (any team member, no role check): `teamMembers`, `teamOverview`, `teamRecentForms`, `searchTeam`, `createBrandKit`.
- **Project/form-scoped** (any project member; `teamOnly` explicitly fails because it's in the team but not the project): `forms`, `formDetail`, `formAnalytic`, `formIntegrations`, `formReport`, `updateForm`, `renameProject`, `updateFormLogics`, `updateFormVariables`, `updateFormHiddenFields`, `updateFormArchive`, `updateFormTheme`, `duplicateForm`, `submissions`.
- **Owner-only** (admin only; every other authenticated caller errors): `updateTeam`, `inviteMember`, `dissolveTeamCode`, `deleteProjectCode`, `resetTeamInviteCode`.
- **Documented-bug probes** (locked at `error` for every caller):
  - `searchForms` — resolver has `@TeamGuard()` but `SearchFormInput` has no `teamId` field; the guard rejects unconditionally. Drop the row once the decorator is removed.
  - `templateDetail` — server returns `{}`, but `TemplateType.id` is non-nullable so GraphQL errors before the schema is exercised. Drop the row once the resolver is implemented.

### Server bugs locked by the test suite

These are not test bugs — the suite intentionally documents the live behaviour:

- **`deleteForm` returns `true` even when nothing was deleted.** `formService.delete` only removes rows with `status: TRASH`, but the resolver always returns `true`. Locked by `stateful-edges` "deleteForm against a NORMAL form leaves it in place but server still returns true".
- **`searchForms` is broken.** `@TeamGuard()` on a resolver whose input lacks `teamId`. Locked by `permission-matrix` `searchForms — * (error)`.
- **`templateDetail` is a stub.** Returns `{}` and the GraphQL non-nullability check fires. Locked by `permission-matrix` `templateDetail — * (error)`.
- **`updateTeamMemberRole`** exists in the webapp gql but has **no server resolver**. Not probed at all (would always 404 the operation).

### Webapp ops intentionally out of scope

- **External-service-dependent**: `createFormWithAI`, `createFieldsWithAI`,
  `createFormLogicsWithAI`, `createFormThemeWithAI` (OpenAI), `stripeAuthorizeUrl`,
  `connectStripe`, `revokeStripeAccount` (Stripe), `importForm` (external URL),
  `addCustomDomain` (DNS), `exportTeamData` (S3).
- **Phantom resolvers** (webapp calls, no server handler): `updateTeamMemberRole`,
  `emptyTrash`, `submissionLocations`, `createFormField`/`updateFormField`/`deleteFormField`,
  `createFormCustomReport`/`updateFormCustomReport`, `updateFormIntegration` (singular).
- **Destructive ops with delicate setup**: `transferTeam` (changes ownership; covered
  for "non-member target" only in stateful-edges), `leaveTeam` (covered for the
  owner-blocked path), `removeTeamMember` (covered in auth-flows).

## Test design notes

- **Session reuse.** Each role keeps its own `E2EClient` (one cookie jar)
  across all tests in its suite. team-flow and permission-matrix sign up users
  exactly once and never re-authenticate.
- **No global cleanup.** Re-using the same mongo DB across runs accumulates
  test data. Nuke the volume between big runs:
  `docker compose -f docker-compose.test.yml down -v`.
- **Order matters globally.** `rate-limit` is registered last because it
  deliberately burns per-user lockout counters. Within `permission matrix`,
  probe order is: read-only → idempotent writes → ops that mutate shared state
  (e.g. `resetTeamInviteCode` rotates `inviteCode`; it's parked last).
- **Direct DB seeding for MEMBER role.** No server mutation assigns
  `TeamRoleEnum.MEMBER`. `helpers/seed.ts` upserts directly into
  `teammembermodels` (and `projectmembermodels` for project membership). This
  is the only piece of the suite that bypasses the public API.
- **`signUpUser`** in `helpers/fixtures.ts` returns `{ client, id, name,
  email, password }` so suites can use either the cookie-authenticated client
  or the user id (for permission probes / seed targets).

## How the harness works

- **`E2EClient`** wraps native `fetch`. It maintains a tiny cookie jar
  (`HEYFORM_SESSION`, `HEYFORM_LOGGED_IN`, `HEYFORM_DEVICE_ID`) and attaches
  the same `X-Device-Id` + `x-anonymous-id` headers the webapp's Apollo client
  sends — these are what `DeviceIdGuard` and `EndpointAnonymousIdGuard` look
  for.
- **`gql`** posts an Apollo-style JSON body to `/graphql` and returns
  `{ status, data, errors, raw, headers }`. **`gqlOk`** unwraps that, throws
  with a full error payload on failure, and returns `data` on success.
- **Runner** is plain — `defineSuite('name')` returns a `test(name, fn)`
  helper. No Jest, no Mocha. Tests run **sequentially** in registration order
  so closure-based test state (e.g. the matrix `ctx` populated by the setup
  test) is safe.

## Adding new tests

1. **For one-off integration scenarios**: drop a new `*.e2e.test.ts` next to
   its peers, export `build(baseUrl)`, register it inside `run.ts`. Mirror the
   webapp operation in `helpers/gql.ts` if it isn't already there.
2. **For permission boundaries**: add a `MatrixSpec` to `SPECS` in
   `permission-matrix.e2e.test.ts`. Each spec is one operation; the matrix
   handles iterating callers. The `ok(...)` DSL:
   - `ok({ all: 'ok' })` — everyone passes (truly public).
   - `ok({ all: 'ok', anonymous: 'error' })` — auth required, no team context.
   - `ok({ admin: 'ok', otherwise: 'error' })` — owner-only.
   - `ok({ all: 'error' })` — locks a known-broken op until the server is
     fixed.
3. **For validation/edge tests**: pick the closest suite
   (`input-validation`, `stateful-edges`, `auth-flows`) and add a `test(...)`.
4. **For rate-limit/throttling**: add to `rate-limit.e2e.test.ts`; keep it
   last in `run.ts`.

Re-run `pnpm test:e2e` to confirm.

## Troubleshooting

- **`Server at … did not become ready`** — confirm mongo + redis are up and
  the server picked up `SESSION_KEY` and `FORM_ENCRYPTION_KEY`. The readiness
  probe won't flip to `ok` until both checks pass.
- **`Forbidden request error` on GraphQL** — missing `X-Device-Id` /
  `x-anonymous-id`. The harness always sends these; if you see it, something
  is bypassing `E2EClient`.
- **`Limit exceeded. Please try again later.`** — the `rate-limit` suite ran
  before something else expected a clean slate. Flush redis
  (`docker compose -f docker-compose.test.yml exec keydb keydb-cli FLUSHDB`).
- **`No verification code found for verify_…`** — the e2e tests read Redis on
  port `9514` (default keydb mapping). If your KeyDB is elsewhere, export
  `E2E_REDIS_PORT` / `E2E_REDIS_HOST`.
