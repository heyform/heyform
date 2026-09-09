import * as assert from 'assert'

import { parseAIJson } from '../src/utils/ai-json'

type JsonCase = {
  name: string
  input: string
  expected: unknown
}

const validCases: JsonCase[] = [
  { name: 'empty object', input: '{}', expected: {} },
  { name: 'empty array', input: '[]', expected: [] },
  { name: 'null', input: 'null', expected: null },
  { name: 'true', input: 'true', expected: true },
  { name: 'false', input: 'false', expected: false },
  { name: 'zero', input: '0', expected: 0 },
  { name: 'negative number', input: '-42', expected: -42 },
  { name: 'decimal', input: '1.25', expected: 1.25 },
  { name: 'exponent', input: '1.5e-3', expected: 0.0015 },
  { name: 'empty string', input: '""', expected: '' },
  { name: 'string scalar', input: '"Lead form"', expected: 'Lead form' },
  {
    name: 'mixed array',
    input: '[null,true,false,0,"question",{},[]]',
    expected: [null, true, false, 0, 'question', {}, []]
  },
  {
    name: 'surrounding whitespace',
    input: '\n\t {"name":"Lead form"} \r\n',
    expected: { name: 'Lead form' }
  },
  {
    name: 'multilingual text and emoji',
    input: '{"title":"姓名 👩🏽‍💻","description":"العربية 日本語 café"}',
    expected: { title: '姓名 👩🏽‍💻', description: 'العربية 日本語 café' }
  },
  {
    name: 'escaped unicode and surrogate pair',
    input: '{"title":"\\u59d3\\u540d \\ud83d\\ude80"}',
    expected: { title: '姓名 🚀' }
  },
  {
    name: 'escaped quotes and backslashes',
    input: '{"title":"Say \\"hi\\"","path":"C:\\\\forms\\\\new"}',
    expected: { title: 'Say "hi"', path: 'C:\\forms\\new' }
  },
  {
    name: 'escaped control characters',
    input: '{"text":"line\\nnext\\tcolumn\\rreturn\\bback\\fform"}',
    expected: { text: 'line\nnext\tcolumn\rreturn\bback\fform' }
  },
  {
    name: 'syntax-like text stays text',
    input: '{"text":"// comment /* block */ {key: [1,]} ```json"}',
    expected: { text: '// comment /* block */ {key: [1,]} ```json' }
  },
  {
    name: 'URL slashes stay intact',
    input: '{"url":"https://example.com/a?x=1&y=2#fragment"}',
    expected: { url: 'https://example.com/a?x=1&y=2#fragment' }
  },
  {
    name: 'nested rich text',
    input:
      '{"title":[{"type":"paragraph","content":[{"type":"text","text":"Name","marks":[{"type":"bold"}]}]}]}',
    expected: {
      title: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Name', marks: [{ type: 'bold' }] }] }
      ]
    }
  }
]

const repairCases: JsonCase[] = [
  {
    name: 'JSON markdown fence',
    input: '```json\n{"name":"Lead form"}\n```',
    expected: { name: 'Lead form' }
  },
  { name: 'plain markdown fence', input: '```\n[1,2]\n```', expected: [1, 2] },
  {
    name: 'combined common AI mistakes',
    input: "```json\n{name: 'Lead form', fields: [],}\n```",
    expected: { name: 'Lead form', fields: [] }
  },
  { name: 'single quotes', input: "{'name': 'Lead form'}", expected: { name: 'Lead form' } },
  { name: 'unquoted key', input: '{name:"Lead form"}', expected: { name: 'Lead form' } },
  { name: 'unquoted value', input: '{name: Lead form}', expected: { name: 'Lead form' } },
  { name: 'smart quotes', input: '{“name”: “Lead form”}', expected: { name: 'Lead form' } },
  { name: 'missing object comma', input: '{"a":1 "b":2}', expected: { a: 1, b: 2 } },
  { name: 'missing array comma', input: '[1 2 3]', expected: [1, 2, 3] },
  { name: 'trailing object comma', input: '{"a":1,}', expected: { a: 1 } },
  { name: 'trailing array comma', input: '[1,2,]', expected: [1, 2] },
  { name: 'missing colon', input: '{"a" 1}', expected: { a: 1 } },
  { name: 'missing object closing brace', input: '{"a":1', expected: { a: 1 } },
  { name: 'missing array closing bracket', input: '[1,2', expected: [1, 2] },
  {
    name: 'truncated nested containers',
    input: '{"fields":[{"title":"Name"',
    expected: { fields: [{ title: 'Name' }] }
  },
  {
    name: 'truncated rich text string and containers',
    input: '{"content":[{"type":"text","text":"Hi',
    expected: { content: [{ type: 'text', text: 'Hi' }] }
  },
  { name: 'missing value before closing brace', input: '{"title":}', expected: { title: null } },
  { name: 'truncated value', input: '{"title":', expected: { title: null } },
  { name: 'line comment', input: '{"a":1 // generated\n}', expected: { a: 1 } },
  { name: 'block comment', input: '{/* generated */"a":1}', expected: { a: 1 } },
  { name: 'leading comment', input: '// generated\n{"a":1}', expected: { a: 1 } },
  {
    name: 'Python literals',
    input: '{"required":True,"hidden":False,"description":None}',
    expected: { required: true, hidden: false, description: null }
  },
  { name: 'undefined value', input: '{"description":undefined}', expected: { description: null } },
  {
    name: 'literal newline in string',
    input: '{"text":"line\nnext"}',
    expected: { text: 'line\nnext' }
  },
  { name: 'literal tab in string', input: '{"text":"a\tb"}', expected: { text: 'a\tb' } },
  {
    name: 'string concatenation',
    input: '{"text":"hello " + "world"}',
    expected: { text: 'hello world' }
  },
  { name: 'ellipsis in array', input: '[1,2,...]', expected: [1, 2] },
  { name: 'newline delimited objects', input: '{"a":1}\n{"a":2}', expected: [{ a: 1 }, { a: 2 }] },
  { name: 'leading byte order mark', input: '\uFEFF{"a":1}', expected: { a: 1 } },
  {
    name: 'repair does not alter an existing escaped newline',
    input: "{text: 'line\\nnext',}",
    expected: { text: 'line\nnext' }
  }
]

const invalidCases = [
  { name: 'empty response', input: '' },
  { name: 'whitespace response', input: ' \t\n' },
  { name: 'empty markdown fence', input: '```json\n```' },
  { name: 'comment only', input: '/* only comment */' },
  { name: 'missing object key', input: '{:1}' },
  { name: 'invalid unicode hex digits', input: '{"text":"\\uZZZZ"}' },
  { name: 'short unicode escape', input: '{"text":"\\u12"}' },
  { name: 'repeated array separator', input: '{"fields":[1,,2]}' },
  { name: 'prose after object', input: '{"fields":[]} Here is your form.' },
  { name: 'HTML error response', input: '<html>bad gateway</html>' }
]

function testCases(cases: JsonCase[]) {
  for (const { name, input, expected } of cases) {
    assert.deepStrictEqual(parseAIJson(input), expected, name)
  }
}

function testInvalidJsonThrows() {
  for (const { name, input } of invalidCases) {
    assert.throws(() => parseAIJson(input), Error, name)
  }
}

function testJsonRepairDoesNotValidateFieldOrRichTextSchemas() {
  // Syntax repair must be followed by schema validation. These all parse successfully,
  // including prose and unsupported literals that jsonrepair converts into strings.
  const schemaInvalidValues = [
    null,
    [],
    'This is not JSON',
    'NaN',
    'Infinity',
    { fields: 'not an array' },
    { fields: [null, false, 42, 'question'] },
    { fields: [{ kind: 'submit_date', title: 'Hidden question' }] },
    { fields: [{ title: [{ type: 'unsupported', attrs: { onerror: 'alert(1)' } }] }] },
    { fields: [{ title: [{ type: 'paragraph', content: 'not an array' }] }] },
    { fields: [{ title: [{ type: 'text', text: { nested: 'not a string' } }] }] },
    { fields: [{ title: [{ type: 'text', text: 'Name', marks: [null, 'bold', 42] }] }] }
  ]

  for (const value of schemaInvalidValues) {
    assert.deepStrictEqual(parseAIJson(JSON.stringify(value)), value)
  }

  for (const value of ['This is not JSON', 'NaN', 'Infinity']) {
    assert.strictEqual(parseAIJson(value), value)
  }
}

function run() {
  testCases(validCases)
  testCases(repairCases)
  testInvalidJsonThrows()
  testJsonRepairDoesNotValidateFieldOrRichTextSchemas()
}

if (require.main === module) {
  try {
    run()
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  }
}
