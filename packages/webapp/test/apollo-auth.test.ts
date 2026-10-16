import { gql } from '@apollo/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

const { onErrorHandler, clearAuthState, fetchMock } = vi.hoisted(() => ({
  onErrorHandler: { current: undefined as any },
  clearAuthState: vi.fn(),
  fetchMock: vi.fn()
}))

vi.mock('@apollo/client/link/error', async importOriginal => {
  const original = await importOriginal<typeof import('@apollo/client/link/error')>()
  return {
    ...original,
    onError: (handler: Parameters<typeof original.onError>[0]) => {
      onErrorHandler.current = handler
      return original.onError(handler)
    }
  }
})

vi.mock('../src/utils/auth', () => ({ clearAuthState, getDeviceId: vi.fn() }))
vi.mock('@/consts', () => ({
  GRAPHQL_API_URL: 'http://localhost/graphql',
  IS_PROD: true,
  LOCALE_COOKIE_NAME: 'locale'
}))

beforeEach(async () => {
  clearAuthState.mockClear()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('document', { cookie: '' })
  vi.stubGlobal('navigator', { language: 'en' })
  vi.stubGlobal('window', { location: { href: '/dashboard' } })
  await import('../src/utils/apollo')
})

afterEach(() => vi.unstubAllGlobals())

test.each(
  [
    [{ code: 'UNAUTHORIZED', message: 'Unauthorized' }],
    [{ status: 401, message: 'Unauthorized' }],
    [{ code: 'FORBIDDEN' }, { code: 'UNAUTHORIZED' }]
  ].map(errors => [errors])
)('clears stale authentication and redirects for %j', errors => {
  onErrorHandler.current({ response: { errors } })

  expect(clearAuthState).toHaveBeenCalledOnce()
  expect(window.location.href).toBe('/logout')
})

test.each(
  [
    [{ code: 'FORBIDDEN', message: 'Forbidden' }],
    [{ status: 403, message: 'Forbidden' }],
    [{ code: 'BAD_USER_INPUT' }],
    [{ code: 'INTERNAL_SERVER_ERROR' }],
    []
  ].map(errors => [errors])
)('preserves authentication for %j', errors => {
  onErrorHandler.current({ response: { errors } })

  expect(clearAuthState).not.toHaveBeenCalled()
  expect(window.location.href).toBe('/dashboard')
})

test('preserves authentication when there is no GraphQL response', () => {
  onErrorHandler.current({})

  expect(clearAuthState).not.toHaveBeenCalled()
  expect(window.location.href).toBe('/dashboard')
})

test.each(['UNAUTHORIZED', 'FORBIDDEN'])('handles a real Apollo response with %s', async code => {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify({ errors: [{ code, message: code }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })
  )
  const { apollo } = await import('../src/utils/apollo')

  await expect(
    apollo.query({
      query: gql`
        query AuthProbe {
          authProbe
        }
      `,
      fetchPolicy: 'no-cache'
    })
  ).rejects.toThrow(code)

  expect(fetchMock).toHaveBeenCalledOnce()
  expect(clearAuthState).toHaveBeenCalledTimes(code === 'UNAUTHORIZED' ? 1 : 0)
  expect(window.location.href).toBe(code === 'UNAUTHORIZED' ? '/logout' : '/dashboard')
})
