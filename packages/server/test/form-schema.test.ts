import {
  ActionEnum,
  ComparisonEnum,
  FieldKindEnum,
  FormField,
  Logic
} from '@heyform-inc/shared-types-enums'
import * as assert from 'assert'

import {
  assertValidChoiceBranching,
  assertValidFormNavigation,
  isSafeCSSValue,
  isSafeCustomCSS,
  sanitizeFormDrafts
} from '../src/utils/form-schema'

function testDefaultNavigationValidation() {
  const fields: FormField[] = [
    { id: 'q1', kind: FieldKindEnum.SHORT_TEXT, nextFieldId: 'q3' },
    { id: 'q2', kind: FieldKindEnum.SHORT_TEXT },
    { id: 'q3', kind: FieldKindEnum.SHORT_TEXT, nextFieldId: 'end' },
    { id: 'end', kind: FieldKindEnum.THANK_YOU }
  ]

  assert.doesNotThrow(() => assertValidFormNavigation(fields))
  assert.strictEqual(sanitizeFormDrafts(fields)[0].nextFieldId, 'q3')

  assert.throws(() => assertValidFormNavigation([...fields, fields[0]]), /IDs must be unique/)
  assert.throws(
    () =>
      assertValidFormNavigation([
        ...fields,
        { id: 'group', kind: FieldKindEnum.GROUP, properties: { fields: [fields[0]] } }
      ]),
    /IDs must be unique/
  )
  assert.throws(
    () =>
      assertValidFormNavigation([
        {
          id: 'outer',
          kind: FieldKindEnum.GROUP,
          properties: {
            fields: [
              {
                id: 'inner',
                kind: FieldKindEnum.GROUP,
                properties: {
                  fields: [{ id: 'child', kind: FieldKindEnum.SHORT_TEXT, nextFieldId: 'missing' }]
                }
              }
            ]
          }
        }
      ]),
    /Nested question groups/
  )

  for (const nextFieldId of ['missing', 'q1', '']) {
    assert.throws(() =>
      assertValidFormNavigation([{ ...fields[0], nextFieldId }, ...fields.slice(1)])
    )
  }

  assert.throws(() =>
    assertValidFormNavigation([
      ...fields.slice(0, 2),
      { ...fields[2], nextFieldId: 'q1' },
      fields[3]
    ])
  )

  assert.doesNotThrow(() =>
    assertValidFormNavigation([
      { id: 'group', kind: FieldKindEnum.GROUP, properties: { fields: [fields[0]] } },
      ...fields.slice(1)
    ])
  )

  // Forms without explicit destinations keep saving as they did before.
  const linear = fields.map(field => ({ ...field, nextFieldId: undefined }))
  assert.doesNotThrow(() => assertValidFormNavigation([...linear, linear[0]]))
  assert.doesNotThrow(() =>
    assertValidFormNavigation([
      {
        id: 'outer',
        kind: FieldKindEnum.GROUP,
        properties: {
          fields: [
            {
              id: 'inner',
              kind: FieldKindEnum.GROUP,
              properties: { fields: [{ id: 'child', kind: FieldKindEnum.SHORT_TEXT }] }
            }
          ]
        }
      }
    ])
  )
}

function testSanitizesDraftRichText() {
  const drafts = sanitizeFormDrafts([
    {
      id: 'field_1',
      kind: 'short_text',
      title: '<p>Hello<img src=x onerror=alert(1)></p>',
      titleSchema: '<svg onload=alert(1)>bad</svg>',
      description: [
        [
          'a',
          ['<img src=x onerror=alert(1)>'],
          {
            href: '" onmouseover="alert(1)',
            style: 'background: url(javascript:alert(1))'
          }
        ]
      ],
      properties: {
        fields: [
          {
            id: 'child_1',
            kind: 'short_text',
            title: '<span onclick="alert(1)">Child</span>',
            description: '<script>alert(1)</script>'
          }
        ]
      }
    }
  ])

  assert.deepStrictEqual(drafts[0].title, [['p', ['Hello']]])
  assert.deepStrictEqual(drafts[0].titleSchema, [])
  assert.deepStrictEqual(drafts[0].description, [
    [
      'a',
      ['&lt;img src=x onerror=alert(1)&gt;'],
      {
        href: '&quot; onmouseover=&quot;alert(1)'
      }
    ]
  ])
  assert.deepStrictEqual(drafts[0].properties.fields[0].title, [['span', ['Child']]])
  assert.deepStrictEqual(drafts[0].properties.fields[0].description, [])
}

function testSanitizesNestedGroupDrafts() {
  const drafts = sanitizeFormDrafts([
    {
      id: 'group_1',
      kind: 'group',
      title: 'Parent',
      properties: {
        fields: [
          {
            id: 'group_2',
            kind: 'group',
            title: '<p>Child group</p>',
            properties: {
              fields: [
                {
                  id: 'child_1',
                  kind: 'short_text',
                  title: '<img src=x onerror=alert(1)>Nested child'
                }
              ]
            }
          }
        ]
      }
    }
  ])

  assert.deepStrictEqual(drafts[0].properties.fields[0].title, [['p', ['Child group']]])
  assert.deepStrictEqual(drafts[0].properties.fields[0].properties.fields[0].title, [
    'Nested child'
  ])
}

function testDropsUnsafeHrefProtocols() {
  const drafts = sanitizeFormDrafts([
    {
      id: 'field_1',
      kind: 'short_text',
      title: [
        [
          'a',
          ['click me'],
          {
            href: 'javascript:alert(1)'
          }
        ]
      ]
    }
  ])

  assert.deepStrictEqual(drafts[0].title, [['a', ['click me']]])
}

function testDropsControlCharacterSplitUnsafeHrefProtocols() {
  const drafts = sanitizeFormDrafts([
    {
      id: 'field_1',
      kind: 'short_text',
      title: [
        [
          'a',
          ['click me'],
          {
            href: 'java\tscript:alert(1)'
          }
        ]
      ]
    }
  ])

  assert.deepStrictEqual(drafts[0].title, [['a', ['click me']]])
}

function testCustomCssRejectsHtmlBreakingCharacters() {
  assert.strictEqual(isSafeCustomCSS('body { color: red; }'), true)
  assert.strictEqual(
    isSafeCustomCSS('body { color: red; }</style><script>alert(1)</script>'),
    false
  )
  assert.strictEqual(isSafeCustomCSS('body:before { content: "<"; }'), false)
}

function testCssValueRejectsRuleBreakingCharacters() {
  assert.strictEqual(isSafeCSSValue(undefined), true)
  assert.strictEqual(isSafeCSSValue(''), true)
  assert.strictEqual(isSafeCSSValue('https://forms.example.com/background.png?x=1&y=2'), true)
  assert.strictEqual(isSafeCSSValue('rgba(255, 255, 255, 0.8)'), true)
  assert.strictEqual(isSafeCSSValue('linear-gradient(to right, #fff 0%, #000 100%)'), true)
  assert.strictEqual(isSafeCSSValue('radial-gradient(circle, #fff 0%, #000 100%)'), true)
  assert.strictEqual(
    isSafeCSSValue('http://a.com/x);}body::after{content:"PWNED";position:fixed}/*'),
    false
  )
  assert.strictEqual(isSafeCSSValue('url(image.png); color: red'), false)
  assert.strictEqual(isSafeCSSValue('linear-gradient(#fff, #000)\u0000'), false)

  for (const character of ['<', '>', '{', '}', ';', '\u0000']) {
    assert.strictEqual(isSafeCSSValue(`red${character}`), false)
  }
}

function testChoiceBranchingValidation() {
  const role: FormField = {
    id: 'role',
    title: 'Role',
    kind: FieldKindEnum.MULTIPLE_CHOICE,
    validations: { required: true },
    properties: {
      choices: [
        { id: 'motion', label: 'Motion' },
        { id: 'director', label: 'Director' }
      ]
    }
  }
  const fields: FormField[] = [
    { id: 'group', kind: FieldKindEnum.GROUP, properties: { fields: [role] } },
    { id: 'motion-q', kind: FieldKindEnum.SHORT_TEXT },
    { id: 'director-q', kind: FieldKindEnum.SHORT_TEXT },
    { id: 'end', kind: FieldKindEnum.THANK_YOU }
  ]
  const jump = (expected: string, fieldId: string) => ({
    id: expected,
    condition: { comparison: ComparisonEnum.IS, expected },
    action: { kind: ActionEnum.NAVIGATE, fieldId }
  })
  const logics = [
    {
      fieldId: 'role',
      branchByAnswer: true,
      payloads: [jump('motion', 'motion-q'), jump('director', 'director-q')]
    }
  ] as Logic[]

  assert.doesNotThrow(() => assertValidChoiceBranching(fields, logics))
  assert.doesNotThrow(() => assertValidChoiceBranching(fields))
  // Ordinary jump rules on a choice question don't opt it into branching.
  assert.doesNotThrow(() =>
    assertValidChoiceBranching(fields, [
      { fieldId: 'role', payloads: [jump('motion', 'motion-q')] }
    ] as Logic[])
  )
  assert.throws(
    () =>
      assertValidChoiceBranching(fields, [
        { fieldId: 'role', branchByAnswer: true, payloads: [jump('motion', 'motion-q')] }
      ] as Logic[]),
    (error: any) =>
      error.response?.error === 'invalid_choice_branching' &&
      error.response?.fieldId === 'role' &&
      /"Role" branches by answer/.test(error.message)
  )
  // Publish validates sanitized drafts, whose titles are rich-text schemas.
  assert.throws(
    () =>
      assertValidChoiceBranching(sanitizeFormDrafts(fields), [
        { fieldId: 'role', branchByAnswer: true, payloads: [jump('motion', 'motion-q')] }
      ] as Logic[]),
    (error: any) => /"Role" branches by answer/.test(error.message)
  )
  assert.throws(
    () =>
      assertValidChoiceBranching(
        [
          { ...fields[0], properties: { fields: [{ ...role, validations: {} }] } },
          ...fields.slice(1)
        ],
        logics
      ),
    (error: any) => error.response?.code === 'not_required'
  )
}

function run() {
  testDefaultNavigationValidation()
  testChoiceBranchingValidation()
  testSanitizesDraftRichText()
  testSanitizesNestedGroupDrafts()
  testDropsUnsafeHrefProtocols()
  testDropsControlCharacterSplitUnsafeHrefProtocols()
  testCustomCssRejectsHtmlBreakingCharacters()
  testCssValueRejectsRuleBreakingCharacters()
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
