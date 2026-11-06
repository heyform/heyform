// @vitest-environment jsdom
import { act } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, test } from 'vitest'

import { Select } from '../src/components'
import i18n from '../src/i18n'

let root: Root
let container: HTMLDivElement

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  await i18n.changeLanguage('en')
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

test('native select uses a dark color scheme when the app is dark', async () => {
  await act(async () =>
    root.render(
      <Select.Native
        options={[
          { label: 'New York', value: 'America/New_York' },
          { label: 'UTC', value: 'UTC' }
        ]}
        value="America/New_York"
      />
    )
  )

  const select = container.querySelector('select')
  expect(select).not.toBeNull()
  expect(select!.className).toContain('dark:[color-scheme:dark]')
  expect(select!.className).toContain('dark:[&_option]:bg-foreground')
  expect(select!.className).toContain('dark:[&_option]:text-primary')
})
