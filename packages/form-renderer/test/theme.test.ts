import * as assert from 'assert'
import { test } from 'vitest'

import { SYSTEM_FONTS, getTheme, getThemeStyle, getWebFontURL, insertWebFont } from '../src/theme'

function testPreservesSystemFontsWithoutLoadingGoogleFonts() {
  const theme = getTheme({
    fontFamily: SYSTEM_FONTS
  })

  assert.strictEqual(theme.fontFamily, SYSTEM_FONTS)
  assert.strictEqual(getWebFontURL(theme.fontFamily), '')
  assert.ok(getThemeStyle(theme).includes(`--heyform-font-family: ${SYSTEM_FONTS};`))
}

function testRemovesExistingWebFontWhenUsingSystemFonts() {
  let removed = false

  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      getElementById: () => ({
        remove: () => {
          removed = true
        }
      })
    }
  })

  try {
    insertWebFont(SYSTEM_FONTS)
    assert.strictEqual(removed, true)
  } finally {
    Reflect.deleteProperty(globalThis, 'document')
  }
}

function testRendersSupportedBackgroundImages() {
  const urlStyle = getThemeStyle(
    getTheme({
      backgroundImage: 'https://forms.example.com/background.png?x=1&y=2'
    })
  )
  const gradientStyle = getThemeStyle(
    getTheme({
      backgroundImage: 'linear-gradient(to right, #fff 0%, #000 100%)'
    })
  )
  const radialGradientStyle = getThemeStyle(
    getTheme({
      backgroundImage: 'radial-gradient(circle, #fff 0%, #000 100%)'
    })
  )

  assert.match(
    urlStyle,
    /background-image: url\("https:\/\/forms\.example\.com\/background\.png\?x=1&y=2"\);/
  )
  assert.match(gradientStyle, /background-image: linear-gradient\(to right, #fff 0%, #000 100%\);/)
  assert.match(
    radialGradientStyle,
    /background-image: radial-gradient\(circle, #fff 0%, #000 100%\);/
  )
}

function testOmitsBackgroundImageRuleInjection() {
  const payload = 'http://a.com/x);}body::after{content:"PWNED";position:fixed}/*'
  const style = getThemeStyle({
    backgroundImage: payload
  })

  assert.doesNotMatch(style, /body::after/)
  assert.doesNotMatch(style, /PWNED/)
}

function testReplacesUnsafeThemeColorValues() {
  const payload = 'red;}body::after{content:"PWNED";position:fixed}/*'

  for (const property of [
    'questionTextColor',
    'answerTextColor',
    'buttonBackground',
    'buttonTextColor',
    'backgroundColor'
  ]) {
    const style = getThemeStyle({
      [property]: payload
    })

    assert.doesNotMatch(style, /body::after/)
    assert.doesNotMatch(style, /PWNED/)
  }
}

test(
  'preserves system fonts without loading google fonts',
  testPreservesSystemFontsWithoutLoadingGoogleFonts
)
test(
  'removes existing web font when using system fonts',
  testRemovesExistingWebFontWhenUsingSystemFonts
)
test('renders supported background images', testRendersSupportedBackgroundImages)
test('omits background image rule injection', testOmitsBackgroundImageRuleInjection)
test('replaces unsafe theme color values', testReplacesUnsafeThemeColorValues)
