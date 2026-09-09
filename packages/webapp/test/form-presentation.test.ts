import * as assert from 'assert'

import { getFormLanguage } from '../src/pages/form/Render/utils/brower-language'

import { locales } from '../../form-renderer/src/locales'

const languages = Object.keys(locales)
Object.defineProperty(globalThis, 'window', {
  value: { navigator: { language: 'en-US' } },
  configurable: true
})
for (const locale of languages) {
  assert.strictEqual(getFormLanguage(languages, locale), locale)
}
assert.strictEqual(getFormLanguage(languages, 'PT_BR'), 'pt-br')
assert.strictEqual(getFormLanguage(languages), 'en')
assert.strictEqual(getFormLanguage(languages, 'unsupported'), 'en')
Object.defineProperty(window.navigator, 'language', { value: 'it-IT' })
assert.strictEqual(getFormLanguage(languages), 'it')
assert.strictEqual(getFormLanguage(languages, 'en'), 'en')
