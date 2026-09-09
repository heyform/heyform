import * as assert from 'assert'

import { normalizeAIFields } from '../src/utils/ai-fields'
import { normalizeAIRichText } from '../src/utils/ai-rich-text'
import { sanitizeFormDrafts } from '../src/utils/form-schema'
import { htmlUtils } from '@heyform-inc/answer-utils'

const validCases: Array<[string, unknown, unknown[]]> = [
  ['missing', undefined, []],
  ['null', null, []],
  ['empty text', '', []],
  ['empty list', [], []],
  ['plain text', 'Question', ['Question']],
  ['Unicode', ['你好 👋 café العربية'], ['你好 👋 café العربية']],
  ['mixed text', ['Hello', ' ', 'world'], ['Hello', ' ', 'world']],
  ['literal markup', ['<script>literal</script>'], ['&lt;script&gt;literal&lt;/script&gt;']],
  ['HTML string', '<p>Hello <b>world</b></p>', [['p', ['Hello ', ['b', ['world']]]]]],
  ['null attributes regression', [['p', ['Question'], null]], [['p', ['Question']]]],
  ['missing attributes', [['p', ['Question']]], [['p', ['Question']]]],
  ['empty attributes', [['p', ['Question'], {}]], [['p', ['Question']]]],
  ['string children', [['p', 'Question', null]], [['p', ['Question']]]],
  ['empty node', [['p']], [['p']]],
  ['null children', [['p', null, {}]], [['p']]],
  ['break', [['br']], [['br']]],
  ['null entries', [null, 'Hello', ['b', [null, 'world']]], ['Hello', ['b', ['world']]]],
  [
    'link',
    [['a', ['Website'], { href: 'https://example.com' }]],
    [['a', ['Website'], { href: 'https://example.com' }]]
  ],
  [
    'compact attributes',
    [['a', { href: 'https://example.com' }]],
    [['a', [], { href: 'https://example.com' }]]
  ],
  [
    'attribute values',
    [['span', ['Text'], { contenteditable: false, id: 0, class: null }]],
    [['span', ['Text'], { contenteditable: 'false', id: '0' }]]
  ],
  [
    'mention',
    [['mention', ['Question'], { id: 'field-1' }]],
    [['mention', ['Question'], { id: 'field-1' }]]
  ],
  [
    'variable',
    [['variable', ['Total'], { id: 'total' }]],
    [['variable', ['Total'], { id: 'total' }]]
  ]
]

function assertConsumersAccept(value: unknown[]) {
  const drafts = normalizeAIFields([
    { id: 'field-1', kind: 'short_text', title: value, description: value }
  ])
  assert.doesNotThrow(() => JSON.stringify(drafts))
  for (const field of [drafts[0], sanitizeFormDrafts(drafts)[0]]) {
    assert.doesNotThrow(() => htmlUtils.serialize(field.title as any[]))
    assert.doesNotThrow(() => htmlUtils.serialize(field.description as any[]))
  }
}

for (const [name, input, expected] of validCases) {
  const result = normalizeAIRichText(input)
  assert.deepStrictEqual(result, expected, name)
  assertConsumersAccept(result)
}

const invalidCases: Array<[string, unknown]> = [
  ['root number', 42],
  ['root boolean', true],
  ['root object', { text: 'Question' }],
  ['object node', [{ text: 'Question' }]],
  ['number node', [42]],
  ['boolean node', [false]],
  ['empty tuple', [[]]],
  ['missing tag', [[null, ['Question']]]],
  ['number tag', [[42, ['Question']]]],
  ['object tag', [[{}, ['Question']]]],
  ['array tag', [[['p'], ['Question']]]],
  ['extra tuple member', [['p', ['Question'], {}, 'extra']]],
  ['number children', [['p', 42]]],
  ['boolean children', [['p', false]]],
  ['object children with attributes', [['p', { text: 'Question' }, {}]]],
  ['nested object', [['p', [{ text: 'Question' }]]]],
  ['URL as attributes regression', [['a', ['Website'], 'https://example.com']]],
  ['array attributes', [['a', ['Website'], []]]],
  ['number attributes', [['a', ['Website'], 42]]],
  ['boolean attributes', [['a', ['Website'], false]]],
  ['object attribute value', [['a', ['Website'], { href: { url: 'https://example.com' } }]]],
  ['array attribute value', [['a', ['Website'], { href: ['https://example.com'] }]]],
  ['non-finite attribute', [['p', ['Text'], { id: Infinity }]]],
  ['function attribute', [['p', ['Text'], { id: () => 'id' }]]]
]

for (const [name, input] of invalidCases) {
  assert.throws(() => normalizeAIRichText(input), /AI rich[- ]text/, name)
  for (const property of ['title', 'description']) {
    assert.throws(
      () => normalizeAIFields([{ kind: 'short_text', [property]: input }]),
      /AI rich[- ]text/,
      name
    )
  }
}

for (const protocol of [
  'javascript:alert(1)',
  'JAVASCRIPT:alert(1)',
  'java\tscript:alert(1)',
  'vbscript:evil',
  'data:text/html,evil'
]) {
  const result = normalizeAIRichText([['a', ['Safe label'], { href: protocol, onclick: 'evil()' }]])
  assert.strictEqual(htmlUtils.serialize(result), '<a>Safe label</a>')
  assertConsumersAccept(result)
}
for (const input of [
  '<p onclick="evil()">Hello<script>evil()</script><b>world</b></p>',
  [['p', ['Hello', ['script', ['evil()']], ['b', ['world']]], { onclick: 'evil()' }]]
]) {
  assert.strictEqual(htmlUtils.serialize(normalizeAIRichText(input)), '<p>Hello<b>world</b></p>')
}
const quoted = normalizeAIRichText([
  ['a', ['Link'], { href: 'https://example.com/" onclick="evil' }]
])
assert.strictEqual((quoted[0] as any[])[2].href, 'https://example.com/&quot; onclick=&quot;evil')
assert.ok(!htmlUtils.serialize(quoted).includes('" onclick="'))

for (const href of [
  'https://example.com/?a=1&b=2',
  'https://example.com/?q="quoted"&tag=<value>',
  'https://example.com/?a=1&amp;b=2'
]) {
  let nodes = normalizeAIRichText([['a', ['Link'], { href }]])
  const expected = htmlUtils.serialize(nodes)
  for (let i = 0; i < 3; i++) {
    nodes = sanitizeFormDrafts([{ title: htmlUtils.parse(htmlUtils.serialize(nodes)) }])[0].title
    assert.strictEqual(
      htmlUtils.serialize(nodes),
      expected,
      'save/publish must not re-encode attributes'
    )
    assert.strictEqual(htmlUtils.serialize(normalizeAIRichText(nodes)), expected)
  }
}
for (const href of [
  'java&#x73;cript:alert(1)',
  'javascript&colon;alert(1)',
  'java&Tab;script:alert(1)'
]) {
  const nodes = normalizeAIRichText([['a', ['Link'], { href }]])
  assert.strictEqual((nodes[0] as any[])[2].href, href.replace(/&/g, '&amp;'))
}
const polluted = JSON.parse('[["p",["Safe"],{"__proto__":{"polluted":true}}]]')
assert.throws(() => normalizeAIRichText(polluted), /attribute value/)
assert.strictEqual(({} as any).polluted, undefined)

function nested(depth: number): unknown[] {
  let result: unknown[] = ['leaf']
  for (let i = 0; i < depth; i++) result = [['b', result]]
  return result
}
assertConsumersAccept(normalizeAIRichText(nested(32)))
assert.throws(() => normalizeAIRichText(nested(33)), /maximum nesting depth/)
const cycle: unknown[] = []
cycle.push(['b', cycle])
assert.throws(() => normalizeAIRichText(cycle), /maximum nesting depth/)
assertConsumersAccept(
  normalizeAIRichText(Array.from({ length: 256 }, (_, i) => ['p', [String(i)], null]))
)

const original = Object.freeze([
  Object.freeze(['a', Object.freeze(['Link']), Object.freeze({ href: 'https://example.com' })])
])
assert.doesNotThrow(() => htmlUtils.serialize(normalizeAIRichText(original)))
assert.deepStrictEqual(original, [['a', ['Link'], { href: 'https://example.com' }]])

const nestedGroup = normalizeAIFields([
  {
    id: 'group-1',
    kind: 'group',
    properties: {
      fields: [
        { id: 'legal-1', kind: 'legal_terms', properties: { html: '<p>Agree <b>now</b></p>' } }
      ]
    }
  }
])
const child = (nestedGroup[0].properties as any).fields[0]
assert.strictEqual(htmlUtils.serialize(child.description), '<p>Agree <b>now</b></p>')
assert.doesNotThrow(() => sanitizeFormDrafts(nestedGroup))
assert.throws(
  () =>
    normalizeAIFields([
      {
        kind: 'group',
        properties: { fields: [{ kind: 'short_text', title: [['a', ['Text'], 'url']] }] }
      }
    ]),
  /attributes/
)
