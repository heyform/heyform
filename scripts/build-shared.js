const { spawnSync } = require('child_process')

// Production installs use the shared packages built in the build stage.
if (process.env.NODE_ENV !== 'production' && process.env.HEYFORM_SKIP_SHARED_BUILD !== '1') {
  const result = spawnSync('pnpm', ['build:shared'], { stdio: 'inherit' })

  if (result.error) {
    throw result.error
  }

  process.exitCode = result.status ?? 1
}
