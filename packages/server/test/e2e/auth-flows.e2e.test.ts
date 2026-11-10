import assert from 'assert'

import { E2EClient } from './helpers/client'
import { signUpUser } from './helpers/fixtures'
import {
  CHANGE_EMAIL_CODE_GQL,
  CREATE_TEAM_GQL,
  JOIN_TEAM_GQL,
  LOGIN_GQL,
  REMOVE_TEAM_MEMBER_GQL,
  RESET_PASSWORD_GQL,
  SEND_RESET_EMAIL_GQL,
  TEAMS_GQL,
  TEAM_MEMBERS_GQL,
  UPDATE_EMAIL_GQL,
  UPDATE_USER_PASSWORD_GQL,
  USER_DETAIL_GQL
} from './helpers/gql'
import { strongPassword, uniqueEmail, uniqueName } from './helpers/random'
import { defineSuite } from './helpers/runner'
import { readLatestVerificationCode } from './helpers/verification'

/**
 * Auth-flows suite — end-to-end credential lifecycles. Each test sets up
 * its own user so we never depend on shared session state.
 */
export function build(baseUrl: string) {
  const { suite, test } = defineSuite('auth flows')

  // ── updateUserPassword ───────────────────────────────────────────────────
  test('updateUserPassword rejects wrong currentPassword', async () => {
    const user = await signUpUser(baseUrl)
    const res = await user.client.gql('updateUserPassword', UPDATE_USER_PASSWORD_GQL, {
      input: { currentPassword: 'NotMyPassword1!', newPassword: strongPassword() }
    })
    assert.ok(res.errors.length > 0)
    assert.match(res.errors[0].message, /password does not match/i)
  })

  test('updateUserPassword rejects weak newPassword', async () => {
    const user = await signUpUser(baseUrl)
    const res = await user.client.gql('updateUserPassword', UPDATE_USER_PASSWORD_GQL, {
      input: { currentPassword: user.password, newPassword: 'weakpass' }
    })
    assert.ok(res.errors.length > 0, 'weak password must be rejected')
  })

  test('updateUserPassword rotates credentials, old password rejected and new accepted', async () => {
    const user = await signUpUser(baseUrl)
    const newPassword = strongPassword()

    const ok = await user.client.gqlOk<boolean>('updateUserPassword', UPDATE_USER_PASSWORD_GQL, {
      input: { currentPassword: user.password, newPassword }
    })
    assert.strictEqual(ok, true)

    // Old password no longer works
    const oldLogin = new E2EClient({ baseUrl })
    const stale = await oldLogin.gql('login', LOGIN_GQL, {
      input: { email: user.email, password: user.password }
    })
    assert.ok(stale.errors.length > 0, 'old password must fail')

    // New password works
    const fresh = new E2EClient({ baseUrl })
    const okLogin = await fresh.gqlOk<boolean>('login', LOGIN_GQL, {
      input: { email: user.email, password: newPassword }
    })
    assert.strictEqual(okLogin, true)
    assert.ok(fresh.isAuthenticated())
  })

  // ── sendResetPasswordEmail + resetPassword ───────────────────────────────
  test('sendResetPasswordEmail does not reveal an unknown email', async () => {
    const c = new E2EClient({ baseUrl })
    const ok = await c.gqlOk<boolean>('sendResetPasswordEmail', SEND_RESET_EMAIL_GQL, {
      input: { email: `no-such-user-${Date.now()}@heyform.com` }
    })
    assert.strictEqual(ok, true)
  })

  test('resetPassword end-to-end: request code, reset, login with new password', async () => {
    const user = await signUpUser(baseUrl)

    // 1. Request a reset code (anonymous; the server emails it — we read from Redis).
    const anon = new E2EClient({ baseUrl })
    const ok = await anon.gqlOk<boolean>('sendResetPasswordEmail', SEND_RESET_EMAIL_GQL, {
      input: { email: user.email }
    })
    assert.strictEqual(ok, true)

    // 2. Read the code out of Redis (the same place getVerificationCode writes it).
    const code = await readLatestVerificationCode(`reset_password:${user.id}`)
    assert.ok(code && code.length > 0)

    // 3. Reset the password.
    const newPassword = strongPassword()
    const reset = await anon.gqlOk<boolean>('resetPassword', RESET_PASSWORD_GQL, {
      input: { email: user.email, code, password: newPassword }
    })
    assert.strictEqual(reset, true)

    // 4. Old password no longer works, new password does.
    const stale = new E2EClient({ baseUrl })
    const staleLogin = await stale.gql('login', LOGIN_GQL, {
      input: { email: user.email, password: user.password }
    })
    assert.ok(staleLogin.errors.length > 0, 'old password must fail after reset')

    const fresh = new E2EClient({ baseUrl })
    const freshLogin = await fresh.gqlOk<boolean>('login', LOGIN_GQL, {
      input: { email: user.email, password: newPassword }
    })
    assert.strictEqual(freshLogin, true)
  })

  test('resetPassword rejects an invalid code', async () => {
    const user = await signUpUser(baseUrl)
    const anon = new E2EClient({ baseUrl })
    // Trigger a real code so the user's reset_password bucket exists; then
    // submit a bogus code against it.
    await anon.gqlOk<boolean>('sendResetPasswordEmail', SEND_RESET_EMAIL_GQL, {
      input: { email: user.email }
    })
    const res = await anon.gql('resetPassword', RESET_PASSWORD_GQL, {
      input: { email: user.email, code: '000000', password: strongPassword() }
    })
    assert.ok(res.errors.length > 0)
  })

  // ── Membership-revocation edge ───────────────────────────────────────────
  // ── updateEmail ──────────────────────────────────────────────────────────
  test('updateEmail gives an address to only one of two accounts changing to it at once', async () => {
    const email = uniqueEmail().toLowerCase()
    const users = [await signUpUser(baseUrl), await signUpUser(baseUrl)]

    // Both ask for a code while the address is free, so both pass updateEmail's own check
    const codes: string[] = []

    for (const user of users) {
      await user.client.gqlOk('changeEmailCode', CHANGE_EMAIL_CODE_GQL, { input: { email } })
      codes.push(await readLatestVerificationCode(`verify_email:${user.id}:${email}`))
    }

    const results = await Promise.all(
      users.map((user, index) =>
        user.client.gql('updateEmail', UPDATE_EMAIL_GQL, {
          input: { email, code: codes[index], currentPassword: user.password }
        })
      )
    )

    const changed = results.filter(result => result.errors.length === 0)
    const rejected = results.filter(result => result.errors.length > 0)

    assert.strictEqual(changed.length, 1, 'exactly one account should get the address')
    assert.strictEqual(rejected.length, 1)
    assert.match(rejected[0].errors[0].message, /already exists/i)
  })

  test('removed team member loses team scope but keeps own session', async () => {
    const owner = await signUpUser(baseUrl, { name: uniqueName('RemOwner') })
    const guest = await signUpUser(baseUrl, { name: uniqueName('RemGuest') })

    const teamId = await owner.client.gqlOk<string>('createTeam', CREATE_TEAM_GQL, {
      input: { name: uniqueName('RemWS'), projectName: uniqueName('RemSeed') }
    })
    const teams = await owner.client.gqlOk<any[]>('teams', TEAMS_GQL)
    const inviteCode = teams.find(t => t.id === teamId)!.inviteCode

    // Guest joins.
    await guest.client.gqlOk<boolean>('joinTeam', JOIN_TEAM_GQL, {
      input: { teamId, inviteCode }
    })
    const before = await guest.client.gqlOk<any[]>('teamMembers', TEAM_MEMBERS_GQL, {
      input: { teamId }
    })
    assert.strictEqual(before.length, 2)

    // Owner removes guest.
    const removed = await owner.client.gqlOk<boolean>('removeTeamMember', REMOVE_TEAM_MEMBER_GQL, {
      input: { teamId, memberId: guest.id }
    })
    assert.strictEqual(removed, true)

    // Guest's session cookie is still good for non-team queries.
    const me = await guest.client.gqlOk<any>('userDetail', USER_DETAIL_GQL)
    assert.strictEqual(me.id, guest.id)

    // But team-scoped queries fail.
    const after = await guest.client.gql('teamMembers', TEAM_MEMBERS_GQL, {
      input: { teamId }
    })
    assert.ok(after.errors.length > 0)
  })

  return suite
}
