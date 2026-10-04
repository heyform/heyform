import { expect, test } from 'vitest'

import { htmlUtils } from '../src/html-utils'

const schema = [
  ['b', ['Make any website your Mac desktop wallpaper.&nbsp;']],
  ['div', [['b', [null]]]],
  [
    'div',
    [
      'Plash enables you to have a highly dynamic ',
      [
        'a',
        ['desktop wallpaper.'],
        {
          href: 'https://github.com',
          style: ''
        }
      ],
      ' You could display your favorite news site, Facebook feed, or a random beautiful scenery photo.'
    ]
  ]
]

test('serialize html', () => {
  expect(htmlUtils.serialize(schema, { allowedBlockTags: [] })).toMatchSnapshot()
})

test('preserves escaped attributes across repeated builder round trips', () => {
  const html = '<a href="https://example.com/?a=1&amp;b=2">Link</a>'
  let result = html

  for (let i = 0; i < 3; i++) {
    result = htmlUtils.serialize(htmlUtils.parse(result))
    expect(result).toBe(html)
  }
})

test('serialize html with block tags', () => {
  expect(
    htmlUtils.serialize(schema, {
      allowedBlockTags: ['div', 'p']
    })
  ).toMatchSnapshot()
})

test('parse html', () => {
  expect(htmlUtils.parse(htmlUtils.serialize(schema, { allowedBlockTags: [] }))).toMatchSnapshot()
})

test('parse html with block tags', () => {
  const html = htmlUtils.serialize(schema, {
    allowedBlockTags: ['div', 'p']
  })

  expect(
    htmlUtils.parse(html, {
      allowedBlockTags: ['div', 'p']
    })
  ).toMatchSnapshot()
})

test('purge removes unsafe tags and event handlers', () => {
  expect(
    htmlUtils.purge('<p>Hello<img src=x onerror=alert(1)><span onclick="alert(1)">world</span></p>')
  ).toBe('<p>Hello<span>world</span></p>')
})

test('serialize escapes schema text and attributes', () => {
  expect(
    htmlUtils.serialize([
      [
        'a',
        ['<img src=x onerror=alert(1)>'],
        {
          href: '" onmouseover="alert(1)'
        }
      ]
    ])
  ).toBe('<a href="&quot; onmouseover=&quot;alert(1)">&lt;img src=x onerror=alert(1)&gt;</a>')
})

test('serialize drops unsafe href protocols', () => {
  expect(
    htmlUtils.serialize([
      [
        'a',
        ['click me'],
        {
          href: 'javascript:alert(1)'
        }
      ]
    ])
  ).toBe('<a>click me</a>')
})

test('serialize drops unsafe href protocols split by control characters', () => {
  for (const href of ['java\tscript:alert(1)', 'java\nscript:alert(1)', 'vb\rscript:alert(1)']) {
    expect(
      htmlUtils.serialize([
        [
          'a',
          ['click me'],
          {
            href
          }
        ]
      ])
    ).toBe('<a>click me</a>')
  }
})

test('plain html', () => {
  expect(
    htmlUtils.plain(
      '<p><strong>Programmer\'s guide</strong> about how to <a href="https://github.com">cook at home</a></p>'
    )
  ).toBe("Programmer's guide about how to cook at home")
})

test('plain html with limit', () => {
  expect(
    htmlUtils.plain(
      '<p><strong>Programmer\'s guide</strong> about how to <a href="https://github.com">cook at home</a></p>',
      20
    )
  ).toBe("Programmer's guide a...")
})

test('plain html with large limit', () => {
  expect(
    htmlUtils.plain(
      '<p><strong>Programmer\'s guide</strong> about how to <a href="https://github.com">cook at home</a></p>',
      100
    )
  ).toBe("Programmer's guide about how to cook at home")
})
