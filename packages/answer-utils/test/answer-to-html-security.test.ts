import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { expect, test } from 'vitest'

import { answersToHtml, hiddenFieldsToHtml } from '../src'

test('escapes untrusted answer titles and values', () => {
  const html = answersToHtml([
    {
      id: 'answer-1',
      kind: FieldKindEnum.SHORT_TEXT,
      title: '<img src=x onerror=alert(1)> & "title"',
      value: '</p><a href="https://attacker.test">click me</a>'
    }
  ])

  expect(html).not.toContain('<img')
  expect(html).not.toContain('<a href=')
  expect(html).toContain('<h3>&amp; &quot;title&quot;</h3>')
  expect(html).toContain(
    '&lt;/p&gt;&lt;a href=&quot;https://attacker.test&quot;&gt;click me&lt;/a&gt;'
  )
})

test('does not double-escape entities in serialized titles', () => {
  const html = answersToHtml([
    {
      id: 'answer-1',
      kind: FieldKindEnum.SHORT_TEXT,
      title: 'Terms &amp; Conditions &lt;v2&gt;',
      value: 'Yes'
    }
  ])

  expect(html).toContain('<h3>Terms &amp; Conditions &lt;v2&gt;</h3>')
})

test('escapes untrusted hidden field names and values', () => {
  const html = hiddenFieldsToHtml([
    {
      id: 'hidden-1',
      name: '<style>body{display:none}</style>',
      value: '<svg onload=alert(1)>'
    }
  ])

  expect(html).not.toContain('<style>')
  expect(html).not.toContain('<svg')
  expect(html).toContain('&lt;style&gt;body{display:none}&lt;/style&gt;')
  expect(html).toContain('&lt;svg onload=alert(1)&gt;')
})
