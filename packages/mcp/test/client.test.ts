import { describe, expect, it } from 'vitest'

import { HeyFormClient } from '../src/client'
import { createFakeFetch } from './helpers'

function createClient(fetchImpl: typeof fetch) {
  return new HeyFormClient({
    baseUrl: 'http://heyform.test/',
    email: 'me@example.com',
    password: 'secret',
    deviceId: 'device-1',
    fetch: fetchImpl
  })
}

describe('HeyFormClient', () => {
  it('logs in once and reuses the session cookie and device id', async () => {
    const { fetch, requests, fetchMock } = createFakeFetch(() => ({ data: { teams: [] } }))
    const client = createClient(fetch)

    await client.query('teams', 'query teams { teams { id } }')
    await client.query('teams', 'query teams { teams { id } }')

    expect(requests.map(row => row.operationName)).toEqual(['login', 'teams', 'teams'])
    expect(requests[0].variables).toEqual({
      input: { email: 'me@example.com', password: 'secret' }
    })
    expect(requests[0].headers.cookie).toBeUndefined()
    expect(requests[1].headers.cookie).toBe('HEYFORM_SESSION=session-1')
    expect(requests[2].headers.cookie).toBe('HEYFORM_SESSION=session-1')
    expect(requests.every(row => row.headers['x-device-id'] === 'device-1')).toBe(true)
    expect(fetchMock.mock.calls[0][0]).toBe('http://heyform.test/graphql')
  })

  it('signs in again and retries once when the session is rejected', async () => {
    let calls = 0
    const { fetch, requests } = createFakeFetch(() => {
      calls += 1
      return calls === 1
        ? { errors: [{ message: 'Unauthorized' }] }
        : { data: { teams: [{ id: 't1' }] } }
    })
    const client = createClient(fetch)

    const data = await client.query('teams', 'query teams { teams { id } }')

    expect(data).toEqual({ teams: [{ id: 't1' }] })
    expect(requests.map(row => row.operationName)).toEqual(['login', 'teams', 'login', 'teams'])
    expect(requests[3].headers.cookie).toBe('HEYFORM_SESSION=session-3')
  })

  it('gives up after one retry', async () => {
    const { fetch, requests } = createFakeFetch(() => ({ errors: [{ message: 'Unauthorized' }] }))
    const client = createClient(fetch)

    await expect(client.query('teams', 'query teams { teams { id } }')).rejects.toThrow(
      'Unauthorized'
    )
    expect(requests.map(row => row.operationName)).toEqual(['login', 'teams', 'login', 'teams'])
  })

  it('surfaces GraphQL errors without retrying', async () => {
    const { fetch, requests } = createFakeFetch(() => ({
      errors: [{ message: 'Form not found' }]
    }))
    const client = createClient(fetch)

    await expect(client.query('formDetail', 'query formDetail { x }')).rejects.toThrow(
      'Form not found'
    )
    expect(requests.map(row => row.operationName)).toEqual(['login', 'formDetail'])
  })

  it('reports a failed login and tries again on the next call', async () => {
    let attempts = 0
    const fetchImpl = (async (_url: any, init: any) => {
      attempts += 1
      const { operationName } = JSON.parse(init.body)
      const body =
        attempts === 1
          ? { errors: [{ message: 'Incorrect email or password.' }] }
          : operationName === 'login'
            ? { data: { login: true } }
            : { data: { ok: true } }

      return new Response(JSON.stringify(body), { status: 200 })
    }) as unknown as typeof fetch
    const client = createClient(fetchImpl)

    await expect(client.query('x', 'query x { ok }')).rejects.toThrow(
      'Incorrect email or password.'
    )
    await expect(client.query('x', 'query x { ok }')).resolves.toEqual({ ok: true })
  })
})
