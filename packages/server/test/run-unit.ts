import { spawnSync } from 'child_process'
import { readdirSync } from 'fs'
import path from 'path'

// Each suite runs in a separate process so mocks and environment changes cannot leak.
// Discover new suites automatically; E2E suites have their own runner and dependencies.
const tests = readdirSync(__dirname)
  .filter(file => file.endsWith('.test.ts'))
  .sort()

if (tests.length === 0) {
  throw new Error('No server unit tests found')
}

const serverRoot = path.resolve(__dirname, '..')

for (const test of tests) {
  // eslint-disable-next-line no-console
  console.log(`Running ${test}`)
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
