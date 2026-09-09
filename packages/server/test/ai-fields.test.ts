import { FORM_FIELD_KINDS } from '@heyform-inc/shared-types-enums'
import * as assert from 'assert'

import { normalizeAIFields } from '../src/utils/ai-fields'
import { htmlUtils } from '@heyform-inc/answer-utils'

const [field] = normalizeAIFields([
  {
    id: 'legal',
    kind: 'legal_terms',
    title: 'Consent',
    placeholder: 'unsupported',
    properties: {
      html: '<p>Accept the <b>terms</b>.</p><script>alert(1)</script>',
      invented: true,
      choices: [{ id: 'choice', label: 'Yes', unknown: 1, score: 'wrong' }, 'No'],
      tableColumns: [{ id: 'column', label: 'Name', required: true, unknown: true }],
      price: { type: 'number', value: 10, invalid: true },
      fields: [{ id: 'legal', kind: 'email', unknown: true, properties: { html: 'remove' } }]
    },
    validations: { required: true, min: 'wrong', max: 5, unknown: true },
    layout: { mediaType: 'image', brightness: 200, align: 'unknown', html: 'remove' }
  }
])

assert.strictEqual(field.placeholder, undefined)
assert.deepStrictEqual(field.title, ['Consent'])
assert.strictEqual(
  htmlUtils.serialize(field.description as any[]),
  '<p>Accept the <b>terms</b>.</p>'
)
assert.deepStrictEqual(field.validations, { required: true, max: 5 })
assert.deepStrictEqual(field.layout, { mediaType: 'image', brightness: 100 })
const properties = field.properties as any
assert.strictEqual(properties.html, undefined)
assert.strictEqual(properties.invented, undefined)
assert.deepStrictEqual(properties.choices[0], { id: 'choice', label: 'Yes' })
assert.strictEqual(properties.choices[1].label, 'No')
assert.strictEqual(properties.choices[1].id.length, 12)
assert.deepStrictEqual(properties.tableColumns, [{ id: 'column', label: 'Name', required: true }])
assert.deepStrictEqual(properties.price, { type: 'number', value: 10 })
assert.notStrictEqual(properties.fields[0].id, field.id)
assert.strictEqual(properties.fields[0].unknown, undefined)
assert.deepStrictEqual(properties.fields[0].properties, {})

const [existingDescription] = normalizeAIFields([
  {
    kind: 'legal_terms',
    description: ['Existing'],
    properties: { html: '<p>Fallback</p>' }
  }
])
assert.deepStrictEqual(existingDescription.description, ['Existing'])

const [upload] = normalizeAIFields([
  { kind: 'file_upload', properties: { allowed_file_types: ['pdf'], max_files: 3 } }
])
assert.deepStrictEqual(upload.properties, {})

for (const kind of FORM_FIELD_KINDS) {
  assert.strictEqual(normalizeAIFields([{ kind }])[0].kind, kind)
}

for (const kind of ['submit_date', 'hidden_fields', 'variable', 'hidden_checkbox', 'custom_text']) {
  assert.throws(() => normalizeAIFields([{ kind }]), /Unsupported AI field kind/)
  assert.throws(
    () => normalizeAIFields([{ kind: 'group', properties: { fields: [{ kind }] } }]),
    /Unsupported AI field kind/
  )
}

for (const value of [
  null,
  {},
  [],
  [null],
  [{ kind: 'invented' }],
  [{ kind: 'multiple_choice', properties: { choices: [{}] } }]
]) {
  assert.throws(() => normalizeAIFields(value))
}

// Invalid optional values must be discarded, never coerced or retained as undefined keys.
for (const invalid of [null, undefined, {}, [], true, 1]) {
  const [normalized] = normalizeAIFields([
    {
      kind: 'short_text',
      properties: { buttonText: invalid },
      layout: { mediaUrl: invalid }
    }
  ])
  assert.deepStrictEqual(normalized.properties, {})
  assert.deepStrictEqual(normalized.layout, {})
}
for (const invalid of [null, undefined, {}, [], 'true', 0, 1]) {
  const [normalized] = normalizeAIFields([
    {
      kind: 'short_text',
      hide: invalid,
      validations: { required: invalid },
      properties: { allowMultiple: invalid }
    }
  ])
  assert.strictEqual(Object.prototype.hasOwnProperty.call(normalized, 'hide'), false)
  assert.deepStrictEqual(normalized.validations, {})
  assert.deepStrictEqual(normalized.properties, {})
}
for (const invalid of [null, undefined, {}, [], '10', true, NaN, Infinity, -Infinity]) {
  const [normalized] = normalizeAIFields([
    {
      kind: 'short_text',
      width: invalid,
      validations: { min: invalid, max: invalid },
      properties: { score: invalid, price: { type: 'number', value: invalid } },
      layout: { brightness: invalid }
    }
  ])
  assert.strictEqual(Object.prototype.hasOwnProperty.call(normalized, 'width'), false)
  assert.deepStrictEqual(normalized.validations, {})
  assert.deepStrictEqual(normalized.properties, { price: { type: 'number' } })
  assert.deepStrictEqual(normalized.layout, {})
}

const [falsy] = normalizeAIFields([
  {
    kind: 'short_text',
    hide: false,
    width: 0,
    validations: { required: false, min: 0 },
    properties: { buttonText: '', score: 0, allowMultiple: false, fields: [] },
    layout: { mediaType: 'audio', align: '', brightness: -200 }
  }
])
assert.strictEqual(falsy.hide, false)
assert.strictEqual(falsy.width, 0)
assert.deepStrictEqual(falsy.validations, { required: false, min: 0 })
assert.deepStrictEqual(falsy.properties, {
  buttonText: '',
  score: 0,
  allowMultiple: false,
  fields: []
})
assert.deepStrictEqual(falsy.layout, { brightness: -100 })

for (const invalid of [false, 0, '', {}, [null], [false], [{}], [{ label: 1 }]]) {
  for (const key of ['choices', 'tableColumns']) {
    assert.throws(() =>
      normalizeAIFields([{ kind: 'multiple_choice', properties: { [key]: invalid } }])
    )
  }
}
for (const invalid of [false, 0, '', [], {}, { type: null }, { type: 1 }]) {
  assert.throws(
    () => normalizeAIFields([{ kind: 'payment', properties: { price: invalid } }]),
    /AI price must have a type/
  )
}
for (const invalid of [false, 0, '', {}]) {
  assert.throws(
    () => normalizeAIFields([{ kind: 'group', properties: { fields: invalid } }]),
    /AI fields must be a nonempty array/
  )
}

const [nullable] = normalizeAIFields([
  { kind: 'group', properties: { choices: null, tableColumns: null, price: null, fields: null } }
])
assert.deepStrictEqual(nullable.properties, {})
assert.strictEqual(nullable.layout, null)

const duplicateIds = normalizeAIFields([
  {
    id: 'shared',
    kind: 'group',
    properties: {
      fields: [{ id: 'shared', kind: 'email' }],
      choices: [{ id: 'choice', label: 'One' }, { id: 'choice', label: 'Two' }, 'Three']
    }
  },
  { id: 'shared', kind: 'short_text' },
  { id: '', kind: 'short_text' },
  { id: 123, kind: 'short_text' }
])
assert.strictEqual(duplicateIds[0].id, 'shared')
const allIds = duplicateIds
  .map(item => item.id)
  .concat((duplicateIds[0].properties as any).fields[0].id)
assert.strictEqual(new Set(allIds).size, allIds.length)
const choiceIds = (duplicateIds[0].properties as any).choices.map(item => item.id)
assert.strictEqual(choiceIds[0], 'choice')
assert.strictEqual(new Set(choiceIds).size, choiceIds.length)
assert.deepStrictEqual(normalizeAIFields(duplicateIds), duplicateIds)
