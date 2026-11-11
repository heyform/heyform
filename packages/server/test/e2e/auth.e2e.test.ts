import assert from 'assert'

import { E2EClient } from './helpers/client'
import { LOGIN_GQL, SIGN_UP_GQL, TEAMS_GQL, USER_DETAIL_GQL } from './helpers/gql'
import { strongPassword, uniqueEmail, uniqueName } from './helpers/random'
import { defineSuite } from './helpers/runner'

export function build(baseUrl: string) {
  const { suite, test } = defineSuite('auth')

  test('rejects GraphQL request without a device id', async () => {
    const res = await fetch(`${baseUrl}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        operationName: 'signUp',
        query: SIGN_UP_GQL,
        variables: {
          input: {
            name: uniqueName(),
            email: uniqueEmail(),
            password: strongPassword()
          }
        }
      })
    })
    const body = (await res.json()) as any
    const message = body?.errors?.[0]?.message ?? ''
    assert.ok(
      /Forbidden|forbidden/.test(message),
      `expected Forbidden error, got: ${JSON.stringify(body).slice(0, 200)}`
    )
  })

  test('signs up a new user, sets session cookies, and returns userDetail', async () => {
    const client = new E2EClient({ baseUrl })
    const name = uniqueName()
    const email = uniqueEmail()
    const password = strongPassword()

    const ok = await client.gqlOk<boolean>('signUp', SIGN_UP_GQL, {
      input: { name, email, password }
    })
    assert.strictEqual(ok, true, 'signUp should return true')
    assert.ok(client.jar.get('HEYFORM_SESSION'), 'session cookie should be set')
    assert.ok(client.jar.get('HEYFORM_LOGGED_IN'), 'logged-in flag cookie should be set')

    const detail = await client.gqlOk<any>('userDetail', USER_DETAIL_GQL)
    assert.strictEqual(detail.email, email.toLowerCase())
    assert.strictEqual(detail.name, name)
  })

  test('rejects duplicate sign-up with the same email', async () => {
    const client = new E2EClient({ baseUrl })
    const email = uniqueEmail()
    const password = strongPassword()

    await client.gqlOk('signUp', SIGN_UP_GQL, {
      input: { name: uniqueName(), email, password }
    })

    const second = new E2EClient({ baseUrl })
    const result = await second.gql('signUp', SIGN_UP_GQL, {
      input: { name: uniqueName(), email, password }
    })
    assert.ok(result.errors.length > 0, 'duplicate sign-up should error')
    assert.match(result.errors[0].message, /already exist/i)
  })

  test('gives an email address to only one of several sign-ups at the same moment', async () => {
    const email = uniqueEmail()
    // Each sign-up checks the address is free before creating the user, so without the unique
    // index on users.email several of these can pass the check together
    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        new E2EClient({ baseUrl }).gql('signUp', SIGN_UP_GQL, {
          input: { name: uniqueName(), email, password: strongPassword() }
        })
      )
    )

    const created = results.filter(result => result.errors.length === 0)
    const rejected = results.filter(result => result.errors.length > 0)

    assert.strictEqual(created.length, 1, 'exactly one sign-up should create the account')

    for (const result of rejected) {
      assert.match(result.errors[0].message, /already exist/i)
    }
  })

  test('rejects weak password at sign-up', async () => {
    const client = new E2EClient({ baseUrl })
    const result = await client.gql('signUp', SIGN_UP_GQL, {
      input: { name: uniqueName(), email: uniqueEmail(), password: 'weakpass' }
    })
    assert.ok(result.errors.length > 0, 'weak password should error')
  })

  test('rejects partial invitation details at sign-up', async () => {
    const inputs = [{ teamId: 'team_without_code' }, { inviteCode: 'code_without_team' }]

    for (const invitation of inputs) {
      const client = new E2EClient({ baseUrl })
      const result = await client.gql('signUp', SIGN_UP_GQL, {
        input: {
          name: uniqueName(),
          email: uniqueEmail(),
          password: strongPassword(),
          ...invitation
        }
      })

      assert.ok(result.errors.length > 0, 'partial invitation should error')
      assert.match(result.errors[0].message, /invitation.*invalid|invalid.*invitation/i)
      assert.strictEqual(client.isAuthenticated(), false)
    }
  })

  test('logs in an existing user via the login query', async () => {
    const setup = new E2EClient({ baseUrl })
    const email = uniqueEmail()
    const password = strongPassword()
    await setup.gqlOk('signUp', SIGN_UP_GQL, {
      input: { name: uniqueName(), email, password }
    })

    const login = new E2EClient({ baseUrl })
    const ok = await login.gqlOk<boolean>('login', LOGIN_GQL, {
      input: { email, password }
    })
    assert.strictEqual(ok, true)
    assert.ok(login.isAuthenticated(), 'login should attach session cookies to the fresh client')

    // Verify session is usable for an @Auth() query
    const teams = await login.gqlOk<any[]>('teams', TEAMS_GQL)
    assert.ok(Array.isArray(teams), 'teams query should succeed for an authenticated user')
  })

  test('rejects login with wrong password', async () => {
    const client = new E2EClient({ baseUrl })
    const email = uniqueEmail()
    const password = strongPassword()
    await client.gqlOk('signUp', SIGN_UP_GQL, {
      input: { name: uniqueName(), email, password }
    })

    const fresh = new E2EClient({ baseUrl })
    const result = await fresh.gql('login', LOGIN_GQL, {
      input: { email, password: 'WrongPass1!' }
    })
    assert.ok(result.errors.length > 0, 'wrong password should error')
    assert.match(result.errors[0].message, /Incorrect email or password/i)
  })

  test('rejects login for a non-existent account', async () => {
    const client = new E2EClient({ baseUrl })
    const result = await client.gql('login', LOGIN_GQL, {
      input: { email: uniqueEmail('ghost'), password: strongPassword() }
    })
    assert.ok(result.errors.length > 0)
    assert.match(result.errors[0].message, /Incorrect email or password/i)
  })

  test('returns 401 from authenticated queries when no session is present', async () => {
    const client = new E2EClient({ baseUrl })
    const result = await client.gql('userDetail', USER_DETAIL_GQL)
    assert.ok(result.errors.length > 0)
    const status = result.errors[0]?.extensions?.code || result.errors[0]?.extensions?.status
    const message = result.errors[0].message
    assert.ok(
      status === 'UNAUTHENTICATED' || /Unauthorized/i.test(message),
      `expected unauthorized error, got ${JSON.stringify(result.errors[0])}`
    )
  })

  test('logout clears session cookies and redirects to /login', async () => {
    const client = new E2EClient({ baseUrl })
    await client.gqlOk('signUp', SIGN_UP_GQL, {
      input: { name: uniqueName(), email: uniqueEmail(), password: strongPassword() }
    })
    assert.ok(client.isAuthenticated(), 'precondition: signed-up user has session')

    const res = await client.restGet('/logout')
    assert.strictEqual(res.status, 302, 'logout should respond with a redirect')
    assert.match(res.headers.get('location') || '', /\/login$/, 'should redirect to /login')

    const after = await client.gql('userDetail', USER_DETAIL_GQL)
    assert.ok(after.errors.length > 0, 'userDetail should fail with cleared session')
  })

  return suite
}
