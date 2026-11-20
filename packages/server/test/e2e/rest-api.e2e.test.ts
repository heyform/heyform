import assert from 'assert'
import { createHash } from 'crypto'

import { E2EClient } from './helpers/client'
import { signUpUser } from './helpers/fixtures'
import {
  COMPLETE_SUBMISSION_GQL,
  CREATE_PROJECT_GQL,
  CREATE_TEAM_GQL,
  DELETE_PROJECT_MEMBER_GQL,
  DELETE_SUBMISSIONS_GQL,
  FORMS_GQL,
  FORM_DETAIL_GQL,
  OPEN_FORM_GQL,
  PUBLIC_FORM_GQL,
  REMOVE_TEAM_MEMBER_GQL,
  SUBMISSIONS_GQL,
  TEAMS_GQL,
  TEAM_MEMBERS_GQL,
  TRANSFER_TEAM_GQL
} from './helpers/gql'
import { uniqueEmail, uniqueName } from './helpers/random'
import { defineSuite } from './helpers/runner'
import {
  readStoredApiKey,
  seedProjectMember,
  seedTeamMember,
  setStoredApiKeyExpiry,
  setStoredUserStatus
} from './helpers/seed'

export function build(baseUrl: string) {
  const { suite, test } = defineSuite('rest api')
  const client = new E2EClient({ baseUrl })
  let owner: Awaited<ReturnType<typeof signUpUser>>
  let workspaceId: string
  let projectId: string
  let keyId: string
  let workspaceKey: string
  let keyExpiresAt: number
  let formId: string
  let version: number
  let submissionId: string
  const workspaceName = uniqueName('REST Workspace')
  const formName = uniqueName('REST Form')
  const fieldId = 'restQuestion'
  const answer = 'Ada Lovelace'
  const drafts = [
    {
      id: fieldId,
      kind: 'short_text',
      title: ['What is your name?'],
      validations: { required: false }
    },
    { id: 'restThanks', kind: 'thank_you', title: ['Thanks!'] }
  ]
  const scopes = [
    'workspaces:read',
    'users:read',
    'projects:read',
    'forms:read',
    'forms:write',
    'members:read',
    'members:write',
    'submissions:read',
    'submissions:write'
  ]

  async function rest(
    method: Parameters<E2EClient['restJson']>[0],
    path: string,
    token: string | undefined,
    status: number,
    payload?: unknown
  ) {
    const response = await client.restJson(
      method,
      `/api/v1${path}`,
      payload,
      token ? { authorization: `Bearer ${token}` } : {}
    )
    assert.strictEqual(
      response.status,
      status,
      `${method} ${path} expected HTTP ${status}, got ${response.status}`
    )
    assert.match(response.headers.get('content-type') ?? '', /^application\/json\b/)
    return response.body
  }

  async function createWorkspace(session: E2EClient, name: string) {
    const id = await session.gqlOk<string>('createTeam', CREATE_TEAM_GQL, {
      input: { name, projectName: 'Default' }
    })
    const teams = await session.gqlOk<any[]>('teams', TEAMS_GQL)
    return { id, projectId: teams.find(t => t.id === id)?.projects[0]?.id as string }
  }

  async function account(
    session: E2EClient,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    status: number,
    payload?: unknown,
    id = ''
  ) {
    const response = await session.accountKeys(method, id, payload)
    assert.strictEqual(response.status, status, `Account API key request ${method} ${id}`)
    if (status < 400) assert.strictEqual(response.headers.get('cache-control'), 'no-store')
    return response.body
  }

  test('health requires a bearer key', async () => {
    await rest('GET', '/health', undefined, 401)
    await rest('GET', '/health', 'invalid', 401)
  })

  test('reads a GraphQL-created workspace and its default project with an account key', async () => {
    owner = await signUpUser(baseUrl)
    const workspace = await createWorkspace(owner.client, workspaceName)
    workspaceId = workspace.id
    projectId = workspace.projectId
    assert.ok(workspaceId && projectId, 'workspace and project IDs are required')

    const key = await account(owner.client, 'POST', 201, {
      workspaceAccess: 'selected',
      workspaceIds: [workspaceId],
      name: 'REST E2E',
      scopes
    })
    assert.ok(typeof key.id === 'string' && key.id.length > 0, 'key ID is required')
    assert.ok(
      /^ak-heyform-[a-zA-Z0-9]{64}$/.test(key.token),
      'key uses the ak-heyform- prefix and 64 characters'
    )
    keyId = key.id
    workspaceKey = key.token
    assert.deepStrictEqual(await rest('GET', '/health', workspaceKey, 200), {
      status: 'ok',
      version: 'v1'
    })
    await rest('POST', '/workspaces', workspaceKey, 404, { name: workspaceName, ownerId: owner.id })
    keyExpiresAt = key.expiresAt
    assert.ok(Number.isInteger(keyExpiresAt), 'expiration uses Unix seconds')
    const lifetime = keyExpiresAt - Math.floor(Date.parse(key.createdAt) / 1000)
    assert.ok(lifetime >= 28 * 86400 && lifetime <= 31 * 86400, 'default lifetime is one month')

    const teams = await owner.client.gqlOk<any[]>('teams', TEAMS_GQL)
    const team = teams.find(t => t.id === workspaceId)
    assert.ok(team)
    const expected = { id: team.id, name: team.name, ownerId: team.ownerId }
    assert.deepStrictEqual(await rest('GET', '/workspaces', workspaceKey, 200), [expected])
    assert.deepStrictEqual(
      await rest('GET', `/workspaces/${workspaceId}`, workspaceKey, 200),
      expected
    )
    assert.deepStrictEqual(
      await rest('GET', `/workspaces/${workspaceId}/projects`, workspaceKey, 200),
      team.projects.map(p => ({ id: p.id, name: p.name, workspaceId: p.teamId, ownerId: owner.id }))
    )
  })

  test('rejects cross-origin account key writes and stores only the hash and display fragments', async () => {
    const anonymous = new E2EClient({ baseUrl })
    await account(anonymous, 'GET', 401)
    await rest('GET', '/account/api-keys', workspaceKey, 401)
    const input = {
      name: 'Cross-origin E2E',
      workspaceAccess: 'selected',
      workspaceIds: [workspaceId],
      scopes: ['workspaces:read']
    }
    for (const [method, path, payload] of [
      ['POST', '', input],
      ['PATCH', `/${keyId}`, input],
      ['POST', `/${keyId}/regenerate`, {}],
      ['DELETE', `/${keyId}`, undefined]
    ] as const) {
      const response = await owner.client.restJson(
        method,
        '/api/v1/account/api-keys' + path,
        payload,
        {
          origin: 'https://example.com',
          'sec-fetch-site': 'cross-site'
        }
      )
      assert.strictEqual(response.status, 403, `Cross-origin ${method} ${path}`)
    }
    const stored = await readStoredApiKey(keyId)
    assert.strictEqual(stored?.ownerId, owner.id)
    assert.ok(stored?.tokenHash === createHash('sha256').update(workspaceKey).digest('hex'))
    assert.strictEqual(
      stored?.tokenPrefix,
      workspaceKey.slice('ak-heyform-'.length, 'ak-heyform-'.length + 8)
    )
    assert.strictEqual(stored?.tokenSuffix, workspaceKey.slice(-8))
    assert.strictEqual(stored?.expiresAt, keyExpiresAt)
    assert.ok(
      !JSON.stringify(stored).includes(workspaceKey),
      'database does not contain the raw key'
    )
    const access = await account(owner.client, 'GET', 200)
    assert.ok(access.scopes.includes('forms:read'))
    assert.ok(access.workspaces.some(workspace => workspace.id === workspaceId))
    assert.deepStrictEqual(
      access.keys.map(key => key.id),
      [keyId]
    )
    const [key] = access.keys
    assert.ok(!('token' in key) && !('tokenHash' in key))
    assert.strictEqual(key.name, 'REST E2E')
    assert.deepStrictEqual(key.scopes, scopes)
    assert.strictEqual(key.tokenPrefix, stored?.tokenPrefix)
    assert.strictEqual(key.tokenSuffix, workspaceKey.slice(-8))
    assert.strictEqual(key.expiresAt, keyExpiresAt)
  })

  test('supports yearly, custom, and permanent expiration and rejects invalid dates', async () => {
    const input = {
      name: 'Expiry E2E',
      workspaceAccess: 'all',
      workspaceIds: [],
      scopes: ['workspaces:read']
    }
    const expiresOn = new Date(Date.now() + 2 * 86400_000).toISOString().slice(0, 10)
    for (const expiration of [
      { expiration: 'invalid' },
      { expiration: 'custom' },
      { expiration: 'custom', expiresOn: '2000-01-01' },
      { expiration: 'custom', expiresOn: '2099-02-30' }
    ]) {
      await account(owner.client, 'POST', 400, { ...input, ...expiration })
    }

    const yearly = await account(owner.client, 'POST', 201, { ...input, expiration: '1y' })
    const lifetime = yearly.expiresAt - Math.floor(Date.parse(yearly.createdAt) / 1000)
    assert.ok(lifetime === 365 * 86400 || lifetime === 366 * 86400)
    const permanent = await account(owner.client, 'POST', 201, { ...input, expiration: 'never' })
    assert.strictEqual(permanent.expiresAt, null)
    await rest('GET', '/workspaces', permanent.token, 200)

    const custom = await account(owner.client, 'POST', 201, {
      ...input,
      expiration: 'custom',
      expiresOn
    })
    const expiry = Date.parse(expiresOn + 'T00:00:00Z') / 1000 + 86400
    assert.strictEqual(custom.expiresAt, expiry)
    assert.strictEqual((await readStoredApiKey(custom.id))?.expiresAt, expiry)
    await rest('GET', '/workspaces', custom.token, 200)

    const past = Math.floor(Date.now() / 1000) - 1
    assert.strictEqual(await setStoredApiKeyExpiry(custom.id, past), 1)
    await rest('GET', '/workspaces', custom.token, 401)
    await account(owner.client, 'PATCH', 404, input, '/' + custom.id)
    await account(owner.client, 'POST', 404, {}, '/' + custom.id + '/regenerate')
    const access = await account(owner.client, 'GET', 200)
    assert.strictEqual(access.keys.find(key => key.id === custom.id)?.expiresAt, past)

    for (const { id } of [yearly, permanent, custom]) {
      await account(owner.client, 'DELETE', 200, undefined, '/' + id)
    }
  })

  test('compares the member roster with GraphQL, invites and removes members', async () => {
    await rest('POST', '/users', workspaceKey, 404, {
      email: uniqueEmail('rest-user'),
      name: 'REST User'
    })
    const member = await signUpUser(baseUrl)
    const path = `/workspaces/${workspaceId}/members`
    await rest('POST', path, workspaceKey, 404, { userId: member.id })
    await seedTeamMember({ teamId: workspaceId, memberId: member.id, role: 2 })

    const roster = await owner.client.gqlOk<any[]>('teamMembers', TEAM_MEMBERS_GQL, {
      input: { teamId: workspaceId }
    })
    const restRoster = await rest('GET', path, workspaceKey, 200)
    assert.deepStrictEqual(
      restRoster.map(m => [m.userId, m.role]).sort(),
      roster.map(m => [m.id, m.role]).sort()
    )
    assert.strictEqual(roster.find(m => m.id === member.id)?.role, 2)
    await rest('GET', `/users?email=${encodeURIComponent(member.email)}`, workspaceKey, 404)
    assert.deepStrictEqual(await rest('GET', '/users/me', workspaceKey, 200), {
      id: owner.id,
      name: owner.name,
      email: owner.email
    })
    await rest('PATCH', `${path}/${member.id}`, workspaceKey, 404, { role: 3 })

    const invitations = `/workspaces/${workspaceId}/invitations`
    await rest('POST', invitations, workspaceKey, 400, { emails: ['not-an-email'] })
    const invitee = uniqueEmail('rest-invitee')
    assert.deepStrictEqual(
      await rest('POST', invitations, workspaceKey, 201, { emails: [invitee, member.email] }),
      { workspaceId, emails: [invitee.toLowerCase()] }
    )
    await rest('DELETE', `${path}/${owner.id}`, workspaceKey, 403)
    assert.deepStrictEqual(await rest('DELETE', `${path}/${member.id}`, workspaceKey, 200), {
      removed: true,
      workspaceId,
      userId: member.id
    })
    await rest('DELETE', `${path}/${member.id}`, workspaceKey, 404)
    const remaining = await owner.client.gqlOk<any[]>('teamMembers', TEAM_MEMBERS_GQL, {
      input: { teamId: workspaceId }
    })
    assert.ok(!remaining.some(m => m.id === member.id))
  })

  test('validates form creation and lists the created form with its draft version', async () => {
    const path = `/projects/${projectId}/forms`
    await rest('POST', path, workspaceKey, 400, { name: '' })
    const form = await rest('POST', path, workspaceKey, 201, { name: formName })
    formId = form.id
    assert.ok(formId, 'form ID is required')
    assert.deepStrictEqual(form, { id: formId, name: formName, projectId, workspaceId })

    const detail = await owner.client.gqlOk<any>('formDetail', FORM_DETAIL_GQL, {
      input: { formId }
    })
    version = detail.version
    assert.strictEqual(version, 0)
    assert.strictEqual(detail.settings.active, false)
    const forms = await owner.client.gqlOk<any[]>('forms', FORMS_GQL, {
      input: { projectId, status: 1 }
    })
    const listed = await rest('GET', path, workspaceKey, 200)
    assert.deepStrictEqual(
      listed.map(f => ({ id: f.id, name: f.name })),
      forms.map(f => ({ id: f.id, name: f.name }))
    )
    assert.strictEqual(listed[0].version, version)
  })

  test('uses the new draft version to publish and exposes the same public fields', async () => {
    const path = `/forms/${formId}`
    const saved = await rest('PATCH', `${path}/drafts`, workspaceKey, 200, { drafts, version })
    assert.strictEqual(saved.id, formId)
    assert.strictEqual(saved.version, version + 1)
    await rest('PATCH', `${path}/drafts`, workspaceKey, 409, { drafts, version })
    await rest('POST', `${path}/publish`, workspaceKey, 409, { drafts, version })
    version = saved.version

    const published = await rest('POST', `${path}/publish`, workspaceKey, 201, { drafts, version })
    assert.strictEqual(published.id, formId)
    assert.strictEqual(published.active, true)
    assert.strictEqual(published.version, version)
    assert.ok(Number.isInteger(published.publishedAt) && published.publishedAt > 0)

    const respondent = new E2EClient({ baseUrl })
    const publicForm = await respondent.gqlOk<any>('publicForm', PUBLIC_FORM_GQL, {
      input: { formId }
    })
    const detail = await rest('GET', path, workspaceKey, 200)
    const fields = (rows: Array<Pick<(typeof drafts)[number], 'id' | 'kind' | 'title'>>) =>
      rows.map(({ id, kind, title }) => ({ id, kind, title }))
    assert.deepStrictEqual(fields(saved.drafts), fields(drafts))
    assert.deepStrictEqual(fields(detail.fields), fields(publicForm.fields))
    assert.deepStrictEqual(fields(detail.fields), fields(drafts))
    assert.strictEqual(detail.active, publicForm.settings.active)
    assert.strictEqual(detail.version, version)
    assert.strictEqual(detail.publishedAt, published.publishedAt)
  })

  test('reads a real submission with the same ID, category and answer', async () => {
    const respondent = new E2EClient({ baseUrl })
    const openToken = await respondent.gqlOk<string>('openForm', OPEN_FORM_GQL, {
      input: { formId }
    })
    await respondent.gqlOk('completeSubmission', COMPLETE_SUBMISSION_GQL, {
      input: { formId, answers: { [fieldId]: answer }, hiddenFields: [], openToken }
    })
    const inbox = await owner.client.gqlOk<any>('submissions', SUBMISSIONS_GQL, {
      input: { formId, category: 'inbox', page: 1, limit: 30 }
    })
    assert.strictEqual(inbox.total, 1)
    const [submission] = inbox.submissions
    submissionId = submission.id
    const detail = await rest(
      'GET',
      `/forms/${formId}/submissions/${submissionId}`,
      workspaceKey,
      200
    )
    assert.strictEqual(detail.id, submissionId)
    assert.strictEqual(detail.formId, formId)
    assert.strictEqual(detail.category, submission.category)
    assert.strictEqual(detail.endAt, submission.endAt)
    assert.strictEqual(detail.answers.find(a => a.id === fieldId)?.value, answer)
  })

  test('paginates submissions and exposes the same ID as the detail endpoint', async () => {
    const path = `/forms/${formId}/submissions`
    const list = await rest('GET', `${path}?page=1&limit=1`, workspaceKey, 200)
    assert.strictEqual(list.total, 1)
    assert.strictEqual(list.page, 1)
    assert.strictEqual(list.limit, 1)
    assert.strictEqual(list.submissions.length, 1)
    const [submission] = list.submissions
    assert.strictEqual(submission.category, 'inbox')
    assert.deepStrictEqual(await rest('GET', `${path}?page=2&limit=1`, workspaceKey, 200), {
      total: 1,
      page: 2,
      limit: 1,
      submissions: []
    })
    await rest('GET', `${path}?page=0`, workspaceKey, 400)
    assert.strictEqual(
      submission.id,
      submissionId,
      `Expected submission id in list response. Fields received: ${Object.keys(submission).join(', ')}`
    )
  })

  test('archives and deletes a submission with matching GraphQL counts', async () => {
    assert.ok(submissionId, 'submission ID is required')
    const path = `/forms/${formId}/submissions/${submissionId}`
    const archived = { id: submissionId, category: 'archive' }
    const archive = () =>
      owner.client.gqlOk<any>('submissions', SUBMISSIONS_GQL, {
        input: { formId, category: 'archive', page: 1, limit: 30 }
      })
    await rest('PATCH', `${path}/category`, workspaceKey, 400, { category: 'invalid' })
    assert.deepStrictEqual(
      await rest('PATCH', `${path}/category`, workspaceKey, 200, { category: 'archive' }),
      archived
    )
    assert.strictEqual((await rest('GET', path, workspaceKey, 200)).category, archived.category)
    assert.deepStrictEqual(
      (await archive()).submissions.map(s => s.id),
      [submissionId]
    )

    await rest('DELETE', path, workspaceKey, 404)
    assert.strictEqual(
      await owner.client.gqlOk('deleteSubmissions', DELETE_SUBMISSIONS_GQL, {
        input: { formId, submissionIds: [submissionId] }
      }),
      true
    )
    await rest('GET', path, workspaceKey, 404)
    assert.strictEqual((await archive()).total, 0)
  })

  test('isolates workspaces and enforces a read-only key scope', async () => {
    const other = await signUpUser(baseUrl)
    const otherName = uniqueName('Other Workspace')
    const workspace = { ...(await createWorkspace(other.client, otherName)), name: otherName }
    const input = {
      workspaceAccess: 'selected',
      workspaceIds: [workspace.id],
      name: 'REST E2E read-only',
      scopes: ['forms:read']
    }
    await account(owner.client, 'POST', 403, input)
    await account(other.client, 'DELETE', 404, undefined, '/' + keyId)
    await account(other.client, 'PATCH', 404, input, '/' + keyId)
    await account(other.client, 'POST', 404, {}, '/' + keyId + '/regenerate')
    await account(owner.client, 'PATCH', 403, input, '/' + keyId)
    const key = await account(other.client, 'POST', 201, input)
    await rest('GET', `/users/${other.id}`, workspaceKey, 404)
    assert.deepStrictEqual(await rest('GET', '/users/me', key.token, 200), {
      id: other.id,
      name: other.name,
      email: other.email
    })
    await rest('GET', `/forms/${formId}`, key.token, 403)
    await rest('POST', `/projects/${workspace.projectId}/forms`, key.token, 403, { name: formName })
    const privileged = await account(owner.client, 'POST', 201, {
      ...input,
      workspaceAccess: 'all',
      workspaceIds: [],
      scopes: ['workspaces:write', 'members:write']
    })
    await seedTeamMember({ teamId: workspace.id, memberId: owner.id, role: 1 })
    await seedProjectMember({ projectId: workspace.projectId, memberId: owner.id })
    await account(owner.client, 'POST', 403, {
      ...input,
      workspaceIds: [workspaceId, workspace.id],
      scopes: ['workspaces:write']
    })
    await rest('PATCH', `/workspaces/${workspace.id}`, privileged.token, 403, { name: 'Forbidden' })
    await rest('POST', `/workspaces/${workspace.id}/invitations`, privileged.token, 403, {
      emails: [uniqueEmail('rest-invitee')]
    })
    await rest('PATCH', `/workspaces/${workspaceId}`, privileged.token, 200, {
      name: workspaceName
    })
    const selected = await account(owner.client, 'POST', 201, {
      ...input,
      scopes: ['workspaces:read'],
      workspaceIds: [workspaceId, workspace.id]
    })
    const all = await account(owner.client, 'POST', 201, {
      ...input,
      scopes: ['workspaces:read'],
      workspaceAccess: 'all',
      workspaceIds: []
    })
    for (const token of [selected.token, all.token]) {
      const ids = (await rest('GET', '/workspaces', token, 200)).map(workspace => workspace.id)
      assert.deepStrictEqual(ids.sort(), [workspaceId, workspace.id].sort())
    }
    assert.deepStrictEqual(
      (await rest('GET', '/workspaces', workspaceKey, 200)).map(workspace => workspace.id),
      [workspaceId]
    )
    const updated = await account(
      owner.client,
      'PATCH',
      200,
      {
        workspaceAccess: 'selected',
        workspaceIds: [workspace.id],
        scopes: ['forms:read']
      },
      '/' + selected.id
    )
    assert.deepStrictEqual(updated.scopes, ['forms:read'])
    assert.deepStrictEqual(updated.workspaceIds, [workspace.id])
    assert.ok(!('token' in updated) && !('tokenHash' in updated))
    await rest('GET', '/workspaces', selected.token, 403)
    await rest('GET', '/projects/' + projectId + '/forms', selected.token, 403)

    await seedTeamMember({ teamId: workspace.id, memberId: owner.id, role: 2 })
    await rest('GET', '/projects/' + workspace.projectId + '/forms', selected.token, 200)
    assert.strictEqual(
      await other.client.gqlOk('removeTeamMember', REMOVE_TEAM_MEMBER_GQL, {
        input: { teamId: workspace.id, memberId: owner.id }
      }),
      true
    )
    await rest('GET', '/projects/' + workspace.projectId + '/forms', selected.token, 403)
    await rest('GET', '/workspaces/' + workspace.id, all.token, 403)
    await account(owner.client, 'DELETE', 200, undefined, '/' + selected.id)
    await account(owner.client, 'DELETE', 200, undefined, '/' + all.id)
    await account(owner.client, 'DELETE', 200, undefined, '/' + privileged.id)
    await account(
      other.client,
      'PATCH',
      200,
      {
        ...input,
        scopes: ['workspaces:read', 'workspaces:write', 'members:write']
      },
      '/' + key.id
    )
    await rest('PATCH', `/workspaces/${workspace.id}`, key.token, 200, {
      name: workspace.name
    })
    await seedTeamMember({ teamId: workspace.id, memberId: owner.id, role: 2 })
    assert.strictEqual(
      await other.client.gqlOk('transferTeam', TRANSFER_TEAM_GQL, {
        input: { teamId: workspace.id, memberId: owner.id }
      }),
      true
    )
    await rest('GET', `/workspaces/${workspace.id}`, key.token, 200)
    await rest('PATCH', `/workspaces/${workspace.id}`, key.token, 403, {
      name: 'Forbidden'
    })
    await rest('DELETE', `/workspaces/${workspace.id}/members/${owner.id}`, key.token, 403)
    await account(other.client, 'DELETE', 200, undefined, '/' + key.id)
  })

  test('matches workspace roles and project membership when granting and using account keys', async () => {
    const workspacePath = '/workspaces/' + workspaceId
    const input = { name: 'Role E2E', workspaceAccess: 'selected', workspaceIds: [workspaceId] }
    const ownerAccess = await account(owner.client, 'GET', 200)
    const allScopes: string[] = ownerAccess.scopes
    assert.deepStrictEqual(
      ownerAccess.workspaces.find(workspace => workspace.id === workspaceId).scopes,
      allScopes
    )
    const memberScopes = allScopes.filter(
      scope => !['workspaces:write', 'members:write'].includes(scope)
    )
    const teamOnlyScopes = [
      'members:read',
      'projects:read',
      'projects:write',
      'users:read',
      'workspaces:read'
    ]

    const hiddenProject = {
      id: await owner.client.gqlOk<string>('createProject', CREATE_PROJECT_GQL, {
        input: { teamId: workspaceId, name: 'Restricted project' }
      })
    }
    const hiddenForm = await rest(
      'POST',
      '/projects/' + hiddenProject.id + '/forms',
      workspaceKey,
      201,
      { name: 'Restricted form' }
    )
    const outsider = await signUpUser(baseUrl)
    assert.ok(
      !(await account(outsider.client, 'GET', 200)).workspaces.some(
        workspace => workspace.id === workspaceId
      )
    )
    await account(outsider.client, 'POST', 403, { ...input, scopes: ['workspaces:read'] })

    for (const [role, inProject] of [
      [1, true],
      [2, true],
      [3, true],
      [3, false]
    ] as const) {
      const user = await signUpUser(baseUrl)
      await seedTeamMember({ teamId: workspaceId, memberId: user.id, role })
      if (inProject) await seedProjectMember({ projectId, memberId: user.id })
      const available = inProject ? memberScopes : teamOnlyScopes
      const access = await account(user.client, 'GET', 200)
      assert.deepStrictEqual(
        access.workspaces.find(workspace => workspace.id === workspaceId).scopes.sort(),
        [...available].sort()
      )
      for (const scope of allScopes.filter(scope => !available.includes(scope))) {
        await account(user.client, 'POST', 403, { ...input, scopes: [scope] })
      }

      const { id, token } = await account(user.client, 'POST', 201, { ...input, scopes: available })
      const projects = await rest('GET', workspacePath + '/projects', token, 200)
      assert.deepStrictEqual(
        projects.map(project => project.id),
        inProject ? [projectId] : []
      )
      // The shared matrix covers the role outcomes. Use one member with project
      // access to test lateral access within the same workspace and REST-only routes.
      if (role === 3 && inProject) {
        await account(user.client, 'PATCH', 403, { ...input, scopes: ['members:write'] }, '/' + id)
        await rest('DELETE', workspacePath + '/members/' + owner.id, token, 403)
        await rest('GET', '/users/' + owner.id, token, 200)
        await rest('PATCH', '/projects/' + hiddenProject.id, token, 403, { name: 'Forbidden' })
        await rest('GET', '/forms/' + hiddenForm.id, token, 403)
        await rest('GET', '/forms/' + hiddenForm.id + '/submissions', token, 403)
        await rest('POST', '/forms/' + formId + '/move', token, 403, {
          targetProjectId: hiddenProject.id
        })
        await rest(
          'PATCH',
          '/forms/' + formId + '/submissions/000000000000000000000001/category',
          token,
          404,
          { category: 'archive' }
        )
        await rest('GET', `/forms/${formId}`, token, 200)
        assert.strictEqual(
          await owner.client.gqlOk('deleteProjectMember', DELETE_PROJECT_MEMBER_GQL, {
            input: { projectId, memberId: user.id }
          }),
          true
        )
        await rest('GET', `/forms/${formId}`, token, 403)
        await rest('GET', workspacePath, token, 200)
      } else if (!inProject) {
        const project = await rest('POST', workspacePath + '/projects', token, 201, {
          name: 'Member project'
        })
        assert.strictEqual(project.ownerId, user.id)
        await rest('PATCH', '/projects/' + project.id, token, 200, {
          name: 'Renamed member project'
        })
      }
      await account(user.client, 'DELETE', 200, undefined, '/' + id)
    }
    await rest('DELETE', `/forms/${hiddenForm.id}`, workspaceKey, 404)
    await rest('DELETE', '/projects/' + hiddenProject.id, workspaceKey, 404)
  })

  test('moves a form to trash and restores it in both APIs', async () => {
    const path = `/forms/${formId}`
    assert.deepStrictEqual(await rest('POST', `${path}/trash`, workspaceKey, 201), {
      id: formId,
      trashed: true
    })
    const list = (status: number) =>
      owner.client.gqlOk<any[]>('forms', FORMS_GQL, { input: { projectId, status } })
    assert.ok((await list(2)).some(f => f.id === formId))
    assert.deepStrictEqual(await rest('GET', `/projects/${projectId}/forms`, workspaceKey, 200), [])
    assert.deepStrictEqual(await rest('POST', `${path}/restore`, workspaceKey, 201), {
      id: formId,
      restored: true
    })
    assert.ok((await list(1)).some(f => f.id === formId))
    assert.strictEqual((await rest('GET', path, workspaceKey, 200)).active, false)
  })

  test('rotates the key and preserves its workspace access and permissions', async () => {
    const key = await account(owner.client, 'POST', 201, {}, '/' + keyId + '/regenerate')
    assert.ok(/^ak-heyform-[a-zA-Z0-9]{64}$/.test(key.token))
    assert.ok(key.token !== workspaceKey, 'regeneration returns a new key')
    assert.strictEqual(key.id, keyId)
    assert.deepStrictEqual(key.scopes, scopes)
    assert.deepStrictEqual(key.workspaceIds, [workspaceId])
    assert.strictEqual(
      key.tokenPrefix,
      key.token.slice('ak-heyform-'.length, 'ak-heyform-'.length + 8)
    )
    assert.strictEqual(key.tokenSuffix, key.token.slice(-8))
    assert.strictEqual(key.expiresAt, keyExpiresAt)
    await rest('GET', '/workspaces', workspaceKey, 401)
    workspaceKey = key.token
    await rest('GET', '/workspaces/' + workspaceId, workspaceKey, 200)
    const stored = await readStoredApiKey(keyId)
    assert.ok(stored?.tokenHash === createHash('sha256').update(workspaceKey).digest('hex'))
    assert.strictEqual(stored?.tokenSuffix, workspaceKey.slice(-8))
    assert.strictEqual(stored?.tokenPrefix, key.tokenPrefix)
    assert.ok(!JSON.stringify(stored).includes(workspaceKey))
  })

  for (const flag of ['isBlocked', 'isDeletionScheduled'] as const) {
    test(`rejects existing account keys when the owner has ${flag} set`, async () => {
      const active = { isBlocked: false, isDeletionScheduled: false }
      assert.strictEqual(await setStoredUserStatus(owner.id, { ...active, [flag]: true }), 1)
      try {
        await rest('GET', `/workspaces/${workspaceId}`, workspaceKey, 401)
        await account(owner.client, 'GET', 403)
      } finally {
        await setStoredUserStatus(owner.id, active)
      }
    })
  }

  test('deletes the key and removes it from account listings and storage', async () => {
    assert.deepStrictEqual(await account(owner.client, 'DELETE', 200, undefined, '/' + keyId), {
      deleted: true
    })
    await rest('GET', '/workspaces', workspaceKey, 401)
    assert.strictEqual(await readStoredApiKey(keyId), null)
    assert.deepStrictEqual((await account(owner.client, 'GET', 200)).keys, [])
  })

  return suite
}
