const { spawnSync } = require('child_process')

// Production installs use the shared packages built in the build stage.
if (process.env.NODE_ENV !== 'production' && process.env.HEYFORM_SKIP_SHARED_BUILD !== '1') {
  // npm_execpath points to pnpm's JS entry point, avoiding Windows .cmd shims.
  const result = process.env.npm_execpath
    ? spawnSync(process.execPath, [process.env.npm_execpath, 'run', 'build:shared'], {
        stdio: 'inherit'
      })
    : spawnSync('pnpm', ['run', 'build:shared'], {
        stdio: 'inherit',
        shell: process.platform === 'win32'
      })

  if (result.error) {
    throw result.error
  }

  process.exitCode = result.status ?? 1
}
