import assert from 'assert'

import { E2EClient } from './helpers/client'
import { signUpUser } from './helpers/fixtures'
import { COMPLETE_SUBMISSION_GQL, CREATE_TEAM_GQL, OPEN_FORM_GQL, TEAMS_GQL } from './helpers/gql'
import { uniqueName } from './helpers/random'
import { defineSuite } from './helpers/runner'

export function build(baseUrl: string) {
  const { suite, test } = defineSuite('mcp')
  const client = new E2EClient({ baseUrl })
  let workspaceId: string
  let projectId: string
  let token: string
  let requestId = 0

  async function mcp(method: string, params: unknown, auth = token) {
    return client.restJson(
      'POST',
      '/mcp',
      { jsonrpc: '2.0', id: ++requestId, method, params },
      {
        accept: 'application/json, text/event-stream',
        ...(auth ? { authorization: `Bearer ${auth}` } : {})
      }
    )
  }

  async function callTool(name: string, args: Record<string, unknown> = {}) {
    const response = await mcp('tools/call', { name, arguments: args })
    assert.strictEqual(response.status, 200, `tools/call ${name}`)
    const result = response.body.result
    return { isError: !!result.isError, data: JSON.parse(result.content[0].text) }
  }

  test('requires a bearer key', async () => {
    const response = await mcp('tools/list', {}, '')
    assert.strictEqual(response.status, 401)
  })

  test('initializes and lists tools with an account key', async () => {
    const owner = await signUpUser(baseUrl)
    workspaceId = await owner.client.gqlOk<string>('createTeam', CREATE_TEAM_GQL, {
      input: { name: uniqueName('MCP Workspace'), projectName: 'Default' }
    })
    const teams = await owner.client.gqlOk<any[]>('teams', TEAMS_GQL)
    projectId = teams.find(t => t.id === workspaceId)?.projects[0]?.id
    const key = await owner.client.accountKeys('POST', '', {
      name: 'MCP E2E',
      workspaceAccess: 'selected',
      workspaceIds: [workspaceId],
      scopes: ['workspaces:read', 'projects:read', 'forms:read']
    })
    assert.strictEqual(key.status, 201)
    token = key.body.token

    const init = await mcp('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'e2e', version: '1.0.0' }
    })
    assert.strictEqual(init.status, 200)
    assert.strictEqual(init.body.result.serverInfo.name, 'heyform')

    const list = await mcp('tools/list', {})
    assert.strictEqual(list.status, 200)
    const names = list.body.result.tools.map((t: any) => t.name)
    for (const name of ['list_workspaces', 'get_form', 'publish_form', 'list_submissions'])
      assert.ok(names.includes(name), `tool ${name} is listed`)
  })

  test('calls tools with the key scopes', async () => {
    const workspaces = await callTool('list_workspaces')
    assert.strictEqual(workspaces.isError, false)
    assert.deepStrictEqual(
      workspaces.data.map((w: any) => w.id),
      [workspaceId]
    )

    const forms = await callTool('list_forms', { projectId })
    assert.strictEqual(forms.isError, false)
    assert.deepStrictEqual(forms.data, [])

    const denied = await callTool('create_form', { projectId, name: 'Denied' })
    assert.strictEqual(denied.isError, true)
    assert.strictEqual(denied.data.statusCode, 403)
  })

  test('marks write tools as destructive unless they only add data', async () => {
    const list = await mcp('tools/list', {})
    const hints = Object.fromEntries(
      list.body.result.tools.map((t: any) => [t.name, t.annotations])
    )
    assert.deepStrictEqual(hints.get_form, { readOnlyHint: true, destructiveHint: false })
    assert.deepStrictEqual(hints.create_form, { readOnlyHint: false, destructiveHint: false })
    for (const name of ['publish_form', 'unpublish_form', 'update_form_drafts', 'trash_form'])
      assert.deepStrictEqual(
        hints[name],
        { readOnlyHint: false, destructiveHint: true },
        `${name} is destructive`
      )
  })

  test('maps write tool arguments to the REST API', async () => {
    const owner = await signUpUser(baseUrl)
    const wsId = await owner.client.gqlOk<string>('createTeam', CREATE_TEAM_GQL, {
      input: { name: uniqueName('MCP Write'), projectName: 'Default' }
    })
    const key = await owner.client.accountKeys('POST', '', {
      name: 'MCP E2E Write',
      workspaceAccess: 'selected',
      workspaceIds: [wsId],
      scopes: [
        'projects:read',
        'projects:write',
        'forms:read',
        'forms:write',
        'submissions:read',
        'submissions:write'
      ]
    })
    assert.strictEqual(key.status, 201)
    token = key.body.token

    const ok = async (name: string, args: Record<string, unknown>) => {
      const result = await callTool(name, args)
      assert.strictEqual(result.isError, false, `${name}: ${JSON.stringify(result.data)}`)
      return result.data
    }

    const fieldId = 'mcpQuestion'
    const drafts = [
      { id: fieldId, kind: 'short_text', title: ['Name?'], validations: { required: false } },
      { id: 'mcpThanks', kind: 'thank_you', title: ['Thanks!'] }
    ]
    const [project] = await ok('list_projects', { workspaceId: wsId })
    const { id: formId } = await ok('create_form', {
      projectId: project.id,
      name: uniqueName('MCP Form')
    })

    const saved = await ok('update_form_drafts', { formId, version: 0, drafts })
    assert.strictEqual(saved.version, 1)
    const published = await ok('publish_form', { formId, version: 1, drafts })
    assert.strictEqual(published.active, true)

    await ok('update_form_theme', {
      formId,
      theme: { buttonBackground: '#000000' },
      logo: 'https://example.com/logo.png'
    })
    const form = await ok('get_form', { formId })
    assert.strictEqual(form.themeSettings.theme.buttonBackground, '#000000')
    assert.strictEqual(form.themeSettings.logo, 'https://example.com/logo.png')

    const respondent = new E2EClient({ baseUrl })
    const openToken = await respondent.gqlOk<string>('openForm', OPEN_FORM_GQL, {
      input: { formId }
    })
    await respondent.gqlOk('completeSubmission', COMPLETE_SUBMISSION_GQL, {
      input: { formId, answers: { [fieldId]: 'Ada' }, hiddenFields: [], openToken }
    })
    const list = await ok('list_submissions', { formId, page: 1, limit: 1 })
    assert.strictEqual(list.total, 1)
    const submissionId = list.submissions[0].id
    await ok('update_submission_answer', { formId, submissionId, fieldId, value: 'Grace' })
    const submission = await ok('get_submission', { formId, submissionId })
    assert.strictEqual(submission.answers.find((a: any) => a.id === fieldId)?.value, 'Grace')

    const target = await ok('create_project', { workspaceId: wsId, name: uniqueName('Target') })
    const moved = await ok('move_form', { formId, targetProjectId: target.id })
    assert.strictEqual(moved.projectId, target.id)
    assert.strictEqual((await ok('get_form', { formId })).projectId, target.id)
  })

  return suite
}
