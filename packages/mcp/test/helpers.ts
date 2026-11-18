import { vi } from 'vitest'

export interface RecordedRequest {
  operationName: string
  variables: Record<string, any>
  headers: Record<string, string>
}

type Responder = (
  req: RecordedRequest
) => { data?: any; errors?: { message: string }[] } | undefined

/**
 * Fake HeyForm GraphQL endpoint. `login` succeeds by default and sets a
 * session cookie; every other operation goes through `respond`.
 */
export function createFakeFetch(respond: Responder) {
  const requests: RecordedRequest[] = []

  const fetchMock = vi.fn(async (_url: any, init: any) => {
    const body = JSON.parse(init.body)
    const req: RecordedRequest = {
      operationName: body.operationName,
      variables: body.variables,
      headers: init.headers
    }

    requests.push(req)

    const headers = new Headers({ 'content-type': 'application/json' })
    let payload: any

    if (req.operationName === 'login') {
      headers.append('set-cookie', `HEYFORM_SESSION=session-${requests.length}; Path=/; HttpOnly`)
      payload = { data: { login: true } }
    } else {
      payload = respond(req) || { data: {} }
    }

    return new Response(JSON.stringify(payload), { status: 200, headers })
  })

  return { fetch: fetchMock as unknown as typeof fetch, fetchMock, requests }
}
