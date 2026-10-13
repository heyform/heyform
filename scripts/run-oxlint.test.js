const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')
const test = require('node:test')

function runLauncher(t, cli, args = []) {
  const root = mkdtempSync(join(tmpdir(), 'heyform oxlint '))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, 'scripts'))
  mkdirSync(join(root, 'node_modules', 'oxlint', 'bin'), { recursive: true })
  const launcher = join(root, 'scripts', 'run-oxlint.js')
  copyFileSync(join(__dirname, 'run-oxlint.js'), launcher)
  writeFileSync(join(root, 'node_modules', 'oxlint', 'bin', 'oxlint'), cli)

  return spawnSync(process.execPath, [launcher, ...args], {
    cwd: root,
    env: { ...process.env, PATH: '' },
    encoding: 'utf8'
  })
}

test('passes literal arguments from a path with spaces without Node or pnpm on PATH', t => {
  const args = ['--ignore-pattern', '*.d.ts', 'question with spaces.ts', 'question&echo.ts']
  const result = runLauncher(t, 'console.log(JSON.stringify(process.argv.slice(2)))', args)

  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), args)
  assert.equal(result.stderr, '')
})

test('preserves linter failures and diagnostic output', t => {
  const result = runLauncher(
    t,
    "console.log('lint diagnostic'); console.error('lint failure'); process.exit(2)"
  )

  assert.equal(result.status, 2)
  assert.match(result.stdout, /lint diagnostic/)
  assert.match(result.stderr, /lint failure/)
})

test('preserves the existing missing-native-binding skip', t => {
  const result = runLauncher(t, "console.error('Cannot find native binding'); process.exit(1)")

  assert.equal(result.status, 0)
  assert.match(result.stderr, /Cannot find native binding/)
  assert.match(result.stderr, /Skipping oxlint for now/)
})
