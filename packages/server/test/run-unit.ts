import { spawnSync } from 'child_process'
import * as path from 'path'

const tests = [
  'form-branding.test.ts',
  'templates.test.ts',
  'password-login.test.ts',
  'ai-json.test.ts',
  'ai-fields.test.ts',
  'ai-rich-text.test.ts',
  'ai-form-flow.test.ts',
  'form-schema.test.ts',
  'ai-resolver.test.ts',
  'redis-config.test.ts',
  'oauth-state.test.ts',
  'oidc-security.test.ts',
  'oidc-provisioning.test.ts',
  'notification-recipients.test.ts',
  'export-file.service.test.ts',
  'form-report.service.test.ts',
  'webhook.test.ts',
  'submission-ip.test.ts',
  'submission-ip-disabled.test.ts',
  'submission-ip-limit.test.ts',
  'app-config.test.ts',
  'integration-auth.test.ts',
  'integration-records.test.ts',
  'integration-secrets.test.ts',
  'googlesheets.test.ts'
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
