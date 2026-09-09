import * as assert from 'assert'
import { validateSync } from 'class-validator'

import { UpdateFormThemeResolver } from '../src/resolver/form/update-form-theme.resolver'

const { UpdateFormThemeInput } = require('@graphql')

async function run() {
  const stored: Record<string, unknown> = {
    'themeSettings.favicon': 'https://example.com/old.png'
  }
  const resolver = new UpdateFormThemeResolver({
    update: async (_id: string, updates: Record<string, unknown>) => {
      Object.assign(stored, updates)
      return true
    }
  } as any)

  const input = Object.assign(new UpdateFormThemeInput(), {
    formId: 'form-1',
    theme: {},
    logo: 'https://example.com/logo.png'
  })
  await resolver.updateFormTheme(input)
  assert.strictEqual(stored['themeSettings.favicon'], 'https://example.com/old.png')
  input.favicon = 'https://example.com/new.png'
  assert.strictEqual(validateSync(input).length, 0)
  await resolver.updateFormTheme(input)
  assert.strictEqual(stored['themeSettings.favicon'], input.favicon)
  assert.strictEqual(stored['themeSettings.logo'], input.logo)
  delete input.logo
  await resolver.updateFormTheme(input)
  assert.strictEqual(stored['themeSettings.logo'], null)
  input.favicon = null
  assert.strictEqual(validateSync(input).length, 0)
  await resolver.updateFormTheme(input)
  assert.strictEqual(stored['themeSettings.favicon'], null)
  input.favicon = 'javascript:alert(1)'
  assert.ok(validateSync(input).some(error => error.property === 'favicon'))
}

run().catch(error => {
  console.error(error)
  process.exitCode = 1
})
