import assert from 'assert'

import { UpdateUserResolver } from '../src/resolver/user/update-user.resolver'
import { UserDetailResolver } from '../src/resolver/user/user-detail.resolver'

const user = { id: 'user_1', name: 'Synced Name', email: 'user@example.com', lang: 'en' }

function socialLogin(isManaged: boolean) {
  return {
    findByUserId: async () => ({ kind: 'oidc', userId: user.id }),
    isNameManaged: async (userId: string) => {
      assert.strictEqual(userId, user.id)
      return isManaged
    }
  }
}

function userService() {
  const updates: Array<Record<string, unknown>> = []

  return {
    updates,
    findByEmail: async () => null,
    update: async (_id: string, changes: Record<string, unknown>) => {
      updates.push(changes)
      return true
    }
  }
}

async function testManagedNameCannotBeChanged() {
  const users = userService()
  const resolver = new UpdateUserResolver(users as any, socialLogin(true) as any)

  await assert.rejects(
    () => resolver.updateUser(user as any, { name: 'Edited Name' }),
    /Your name is managed by your identity provider/
  )
  assert.deepStrictEqual(users.updates, [])

  // The rest of the profile stays editable, and resending the current name isn't a change
  assert.strictEqual(
    await resolver.updateUser(user as any, { name: 'Synced Name', avatar: 'https://a/b.png' }),
    true
  )
  assert.deepStrictEqual(users.updates, [{ avatar: 'https://a/b.png' }])
}

async function testUnmanagedNameCanBeChanged() {
  const users = userService()
  const resolver = new UpdateUserResolver(users as any, socialLogin(false) as any)

  assert.strictEqual(await resolver.updateUser(user as any, { name: 'Edited Name' }), true)
  assert.deepStrictEqual(users.updates, [{ name: 'Edited Name' }])
}

async function testUserDetailReportsWhetherTheNameIsManaged() {
  for (const isManaged of [true, false]) {
    const detail = await new UserDetailResolver(socialLogin(isManaged) as any).userDetail(
      user as any
    )

    assert.strictEqual(detail.isSocialAccount, true)
    assert.strictEqual(detail.isNameManaged, isManaged)
  }
}

async function run() {
  await testManagedNameCannotBeChanged()
  await testUnmanagedNameCanBeChanged()
  await testUserDetailReportsWhetherTheNameIsManaged()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
