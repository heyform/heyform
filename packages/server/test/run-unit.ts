import { spawnSync } from 'child_process'
import * as path from 'path'

const tests = [
  'password-login.test.ts',
  'ai-resolver.test.ts',
  'redis-config.test.ts',
  'oauth-state.test.ts',
  'oidc-security.test.ts',
  'oidc-provisioning.test.ts'
]
const serverRoot = path.resolve(__dirname, '..')

for (const test of tests) {
  const result = spawnSync(
    process.execPath,
    [
      '-r',
      require.resolve('ts-node/register/transpile-only'),
      '-r',
      require.resolve('tsconfig-paths/register'),
      path.join(__dirname, test)
    ],
    {
      cwd: serverRoot,
      env: process.env,
      stdio: 'inherit'
    }
  )

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1
    break
  }
}
