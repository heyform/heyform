import * as assert from 'assert'

import { getFormLanguage } from '../src/pages/form/Render/utils/brower-language'
import { setFormMetadata } from '../src/pages/form/Render/utils/metadata'

import { locales } from '../../form-renderer/src/locales'
import { PUBLIC_FORM_GQL } from '../src/consts/gql'

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

const operation = PUBLIC_FORM_GQL.definitions[0] as any
const selection = operation.selectionSet.selections[0].selectionSet.selections
const theme = selection.find((field: any) => field.name.value === 'themeSettings')
assert.deepStrictEqual(theme.selectionSet.selections.map((field: any) => field.name.value).sort(), [
  'favicon',
  'logo',
  'theme'
])

class Link {
  rel = ''
  href = ''
  removeAttribute(name: string) {
    if (name === 'rel') this.rel = ''
  }
  remove() {
    links.splice(links.indexOf(this), 1)
  }
}
const defaultIcon = Object.assign(new Link(), { rel: 'shortcut icon', href: '/favicon.ico' })
const maskIcon = Object.assign(new Link(), { rel: 'mask-icon', href: '/favicon.svg' })
const links = [defaultIcon, maskIcon]
Object.defineProperty(globalThis, 'document', {
  configurable: true,
  value: {
    title: 'HeyForm',
    createElement: () => new Link(),
    head: {
      querySelectorAll: () => links.filter(link => link.rel.includes('icon')),
      appendChild: (link: Link) => links.push(link)
    }
  }
})
const cleanup = setFormMetadata('Customer survey', 'https://example.com/icon.png')
assert.strictEqual(document.title, 'Customer survey')
assert.strictEqual(links.find(link => link.rel === 'icon')?.href, 'https://example.com/icon.png')
assert.strictEqual(defaultIcon.rel, '')
cleanup()
assert.strictEqual(document.title, 'HeyForm')
assert.deepStrictEqual(links, [defaultIcon, maskIcon])
assert.strictEqual(defaultIcon.rel, 'shortcut icon')
assert.strictEqual(maskIcon.rel, 'mask-icon')
for (const favicon of [null, undefined, 'javascript:alert(1)']) {
  const restore = setFormMetadata('Another form', favicon)
  assert.strictEqual(links.length, 2)
  assert.strictEqual(defaultIcon.rel, 'shortcut icon')
  restore()
}
