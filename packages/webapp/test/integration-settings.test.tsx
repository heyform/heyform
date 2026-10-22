// @vitest-environment jsdom
import { act } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, test } from 'vitest'

import {
  getIntegrationDefaultConfig,
  getIntegrationSetting
} from '../src/pages/form/Integrations/utils'

import { Form } from '../src/components'
import i18n from '../src/i18n'
import IntegrationSettingsItem from '../src/pages/form/Integrations/IntegrationSettingsItem'
import type { AppSettingType, IntegratedAppType } from '../src/types/form'

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

const settings: AppSettingType[] = [
  { type: 'text', name: 'title', label: 'Title', required: true },
  { type: 'url', name: 'endpointUrl', label: 'Endpoint URL', required: true },
  { type: 'textarea', name: 'note', label: 'Note', required: false, defaultValue: 'Hello' },
  {
    type: 'select',
    name: 'format',
    label: 'Format',
    required: false,
    options: [
      { label: 'JSON', value: 'json' },
      { label: 'Form data', value: 'form' }
    ],
    defaultValue: 'json'
  },
  {
    type: 'switch',
    name: 'enabled',
    label: 'Enabled',
    description: 'Send test data',
    required: false,
    defaultValue: false
  }
]

const app = {
  id: 'example',
  name: 'Example',
  settings,
  integration: { appId: 'example', status: 1 }
} as IntegratedAppType

async function render(setting: AppSettingType, value?: unknown) {
  await act(async () =>
    root.render(
      <Form key={setting.name} initialValues={{ [setting.name]: value }}>
        <IntegrationSettingsItem setting={setting} />
      </Form>
    )
  )
}

test('renders an input for text and url settings', async () => {
  await render(settings[0], 'Leads')
  expect(container.querySelector('label')?.textContent).toBe('Title')
  expect(container.querySelector('input')?.value).toBe('Leads')

  await render(settings[1], 'https://example.com')
  expect(container.querySelector('input')?.value).toBe('https://example.com')
})

test('renders a textarea setting', async () => {
  await render(settings[2], 'Line 1\nLine 2')
  expect(container.querySelector('textarea')?.value).toBe('Line 1\nLine 2')
})

test('renders a select setting with the selected option', async () => {
  await render(settings[3], 'form')
  expect(container.querySelector('button[role="combobox"]')?.textContent).toContain('Form data')
})

test('renders a switch setting', async () => {
  await render(settings[4], true)
  expect(container.querySelector('[role="switch"]')?.getAttribute('aria-checked')).toBe('true')
  expect(container.textContent).toContain('Send test data')
})

test('falls back to the English labels from the app definition', () => {
  const setting = getIntegrationSetting(i18n.t, app, settings[3])

  expect(setting.label).toBe('Format')
  expect(setting.options).toEqual([
    { label: 'JSON', value: 'json' },
    { label: 'Form data', value: 'form' }
  ])
})

test('translates option labels under the setting key', async () => {
  i18n.addResource(
    'en',
    'translation',
    'form.integrations.apps.example.settings.format.options.form',
    'Form-encoded'
  )

  const setting = getIntegrationSetting(i18n.t, app, settings[3])

  expect(setting.options?.map(option => option.label)).toEqual(['JSON', 'Form-encoded'])
})

test('collects default values for a new integration', () => {
  expect(getIntegrationDefaultConfig(app)).toEqual({
    note: 'Hello',
    format: 'json',
    enabled: false
  })
})
