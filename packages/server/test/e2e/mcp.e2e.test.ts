import assert from 'assert'

import { E2EClient } from './helpers/client'
import { signUpUser } from './helpers/fixtures'
import { CREATE_TEAM_GQL, TEAMS_GQL } from './helpers/gql'
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

  return suite
}
