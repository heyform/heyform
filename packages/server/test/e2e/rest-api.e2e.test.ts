import assert from 'assert'

import { E2EClient } from './helpers/client'
import { signUpUser } from './helpers/fixtures'
import {
  COMPLETE_SUBMISSION_GQL,
  FORMS_GQL,
  FORM_DETAIL_GQL,
  OPEN_FORM_GQL,
  PUBLIC_FORM_GQL,
  SUBMISSIONS_GQL,
  TEAMS_GQL,
  TEAM_MEMBERS_GQL
} from './helpers/gql'
import { uniqueName } from './helpers/random'
import { defineSuite } from './helpers/runner'

export function build(baseUrl: string, adminKey: string) {
  const { suite, test } = defineSuite('rest api')
  const client = new E2EClient({ baseUrl })
  let owner: Awaited<ReturnType<typeof signUpUser>>
  let workspaceId: string
  let projectId: string
  let keyId: string
  let workspaceKey: string
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

  test('health requires a bearer key and returns the API version', async () => {
    await rest('GET', '/health', undefined, 401)
    assert.deepStrictEqual(await rest('GET', '/health', adminKey, 200), {
      status: 'ok',
      version: 'v1'
    })
  })

  test('creates a workspace and its default project visible through GraphQL', async () => {
    owner = await signUpUser(baseUrl)
    const workspace = await rest('POST', '/workspaces', adminKey, 201, {
      name: workspaceName,
      ownerId: owner.id,
      projectName: 'Default'
    })
    workspaceId = workspace.id
    projectId = workspace.projectId
    assert.ok(workspaceId && projectId, 'workspace and project IDs are required')
    assert.deepStrictEqual(workspace, {
      id: workspaceId,
      projectId,
      name: workspaceName,
      ownerId: owner.id
    })

    const key = await rest('POST', '/keys', adminKey, 201, {
      workspaceId,
      name: 'REST E2E',
      scopes
    })
    assert.ok(typeof key.id === 'string' && key.id.length > 0, 'key ID is required')
    assert.ok(typeof key.token === 'string' && key.token.length > 0, 'key token is required')
    keyId = key.id
    workspaceKey = key.token

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

  test('member addition and lookup agree with the GraphQL roster', async () => {
    const member = await signUpUser(baseUrl)
    const path = `/workspaces/${workspaceId}/members`
    assert.deepStrictEqual(await rest('POST', path, workspaceKey, 201, { userId: member.id }), {
      userId: member.id,
      workspaceId
    })

    const roster = await owner.client.gqlOk<any[]>('teamMembers', TEAM_MEMBERS_GQL, {
      input: { teamId: workspaceId }
    })
    const restRoster = await rest('GET', path, workspaceKey, 200)
    assert.deepStrictEqual(
      restRoster.map(m => [m.userId, m.role]).sort(),
      roster.map(m => [m.id, m.role]).sort()
    )
    assert.strictEqual(roster.find(m => m.id === member.id)?.role, 2)
    assert.deepStrictEqual(
      await rest('GET', `/users?email=${encodeURIComponent(member.email)}`, workspaceKey, 200),
      { id: member.id, email: member.email, name: member.name }
    )
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

    assert.deepStrictEqual(await rest('DELETE', path, adminKey, 200), {
      id: submissionId,
      deleted: true
    })
    await rest('GET', path, workspaceKey, 404)
    assert.strictEqual((await archive()).total, 0)
  })

  test('isolates workspaces and enforces a read-only key scope', async () => {
    const other = await signUpUser(baseUrl)
    const workspace = await rest('POST', '/workspaces', adminKey, 201, {
      name: uniqueName('Other Workspace'),
      ownerId: other.id
    })
    const key = await rest('POST', '/keys', adminKey, 201, {
      workspaceId: workspace.id,
      name: 'REST E2E read-only',
      scopes: ['forms:read']
    })
    await rest('GET', `/forms/${formId}`, key.token, 403)
    await rest('GET', `/projects/${projectId}/forms`, key.token, 403)
    await rest('POST', `/projects/${workspace.projectId}/forms`, key.token, 403, { name: formName })
    await rest('DELETE', `/workspaces/${workspace.id}`, adminKey, 200)
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

  test('revokes the workspace key and deletes the test workspace', async () => {
    assert.deepStrictEqual(await rest('DELETE', `/keys/${keyId}`, adminKey, 200), { revoked: true })
    await rest('GET', '/workspaces', workspaceKey, 401)
    assert.deepStrictEqual(await rest('DELETE', `/workspaces/${workspaceId}`, adminKey, 200), {
      deleted: true,
      workspaceId
    })
  })

  return suite
}
