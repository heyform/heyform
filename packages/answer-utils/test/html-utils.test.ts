import { test, expect } from 'vitest'
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
