import { afterEach, describe, expect, it } from 'vitest'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'

import { HeyFormClient } from '../src/client'
import { createServer } from '../src/server'
import { RecordedRequest, createFakeFetch } from './helpers'

const clients: Client[] = []

async function connect(respond: (req: RecordedRequest) => any) {
  const fake = createFakeFetch(respond)
  const server = createServer(
    new HeyFormClient({
      baseUrl: 'http://heyform.test',
      email: 'me@example.com',
      password: 'secret',
      fetch: fake.fetch
    })
  )
  const client = new Client({ name: 'test', version: '0.0.0' })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
  clients.push(client)

  return { client, requests: fake.requests }
}

function parse(result: any) {
  return JSON.parse(result.content[0].text)
}

afterEach(async () => {
  await Promise.all(clients.splice(0).map(client => client.close()))
})

describe('HeyForm MCP tools', () => {
  it('exposes the expected tools, with read-only hints on the read tools', async () => {
    const { client } = await connect(() => ({ data: {} }))
    const { tools } = await client.listTools()

    expect(tools.map(tool => tool.name).sort()).toEqual([
      'create_form',
      'get_form',
      'list_forms',
      'list_submissions',
      'list_workspaces'
    ])
    expect(tools.find(tool => tool.name === 'list_forms')?.annotations?.readOnlyHint).toBe(true)
    expect(tools.find(tool => tool.name === 'create_form')?.annotations?.readOnlyHint).toBe(false)
  })

  it('lists workspaces', async () => {
    const teams = [
      { id: 't1', name: 'Team', projects: [{ id: 'p1', name: 'Default', teamId: 't1' }] }
    ]
    const { client } = await connect(() => ({ data: { teams } }))

    const result = await client.callTool({ name: 'list_workspaces', arguments: {} })

    expect(parse(result)).toEqual(teams)
  })

  it('lists active forms by default and maps status names to the server enum', async () => {
    const { client, requests } = await connect(() => ({
      data: { forms: [{ id: 'f1', name: 'Survey', submissionCount: 3 }] }
    }))

    const active = await client.callTool({ name: 'list_forms', arguments: { projectId: 'p1' } })
    await client.callTool({
      name: 'list_forms',
      arguments: { projectId: 'p1', status: 'trash', keyword: 'old' }
    })

    expect(parse(active)).toEqual([{ id: 'f1', name: 'Survey', submissionCount: 3 }])

    const [first, second] = requests.filter(row => row.operationName === 'forms')

    expect(first.variables).toEqual({ input: { projectId: 'p1', status: 1 } })
    expect(second.variables).toEqual({ input: { projectId: 'p1', status: 2, keyword: 'old' } })
  })

  it('gets a form by id', async () => {
    const { client, requests } = await connect(() => ({
      data: { formDetail: { id: 'f1', drafts: [{ id: 'q1', kind: 'short_text' }] } }
    }))

    const result = await client.callTool({ name: 'get_form', arguments: { formId: 'f1' } })

    expect(parse(result).drafts[0].id).toBe('q1')
    expect(requests.at(-1)?.variables).toEqual({ input: { formId: 'f1' } })
  })

  it('paginates submissions', async () => {
    const { client, requests } = await connect(() => ({
      data: { submissions: { total: 45, submissions: [{ id: 's1' }] } }
    }))

    const first = parse(
      await client.callTool({ name: 'list_submissions', arguments: { formId: 'f1' } })
    )
    const last = parse(
      await client.callTool({
        name: 'list_submissions',
        arguments: { formId: 'f1', page: 2, limit: 30 }
      })
    )

    expect(first).toMatchObject({ page: 1, limit: 30, total: 45, hasMore: true })
    expect(last).toMatchObject({ page: 2, hasMore: false })
    expect(requests.at(-1)?.variables).toEqual({ input: { formId: 'f1', page: 2, limit: 30 } })
  })

  it('rejects an out-of-range page size before calling HeyForm', async () => {
    const { client, requests } = await connect(() => ({ data: {} }))

    const result = await client.callTool({
      name: 'list_submissions',
      arguments: { formId: 'f1', limit: 500 }
    })

    expect(result.isError).toBe(true)
    expect(requests).toHaveLength(0)
  })

  it('creates a form', async () => {
    const { client, requests } = await connect(() => ({ data: { createForm: 'f9' } }))

    const result = await client.callTool({
      name: 'create_form',
      arguments: { projectId: 'p1', name: 'Feedback', kind: 'quiz' }
    })

    expect(parse(result)).toEqual({ formId: 'f9' })
    expect(requests.at(-1)?.variables).toEqual({
      input: { projectId: 'p1', name: 'Feedback', kind: 2, interactiveMode: 1 }
    })
  })

  it('returns server errors as tool errors', async () => {
    const { client } = await connect(() => ({ errors: [{ message: 'Form not found' }] }))

    const result: any = await client.callTool({ name: 'get_form', arguments: { formId: 'nope' } })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toBe('Form not found')
  })
})
