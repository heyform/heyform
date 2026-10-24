// @vitest-environment jsdom
import { act } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import {
  getConnectionLabel,
  getDefaultConnectionId,
  getIntegrationAuthorizeUrl,
  getIntegrationDefaultConfig,
  getIntegrationSetting,
  isSettingVisible,
  needsAccountConnection,
  startsOnNewAccount
} from '../src/pages/form/Integrations/utils'
import { FormService, IntegrationService } from '../src/services'

import { Form } from '../src/components'
import i18n from '../src/i18n'
import {
  ApiKeyItem,
  ConnectAccount,
  ConnectionItem,
  ConnectionsLoadFailed
} from '../src/pages/form/Integrations/IntegrationAuthItem'
import {
  IntegrationRecordList,
  IntegrationWaitingCount
} from '../src/pages/form/Integrations/IntegrationRecords'
import IntegrationSettingsItem, {
  VisibleSetting
} from '../src/pages/form/Integrations/IntegrationSettingsItem'
import { SettingsForm } from '../src/pages/form/Integrations/IntegrationSettingsModal'
import { ConnectedAccountList } from '../src/pages/workspace/Settings/ConnectedAccounts'
import { useAppStore, useFormStore } from '../src/store'
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

// --- auth -------------------------------------------------------------------

const apiKeyApp = {
  id: 'keyapp',
  name: 'Key App',
  auth: { type: 'apiKey', label: 'Secret token', description: 'Find it under Settings.' },
  settings: [],
  integration: { appId: 'keyapp', status: 1 }
} as unknown as IntegratedAppType

const oauthApp = {
  id: 'sheets',
  name: 'Sheets',
  auth: { type: 'oauth2', provider: 'example', providerName: 'Example' },
  settings: [],
  integration: undefined
} as unknown as IntegratedAppType

async function renderNode(node: React.ReactNode) {
  await act(async () => root.render(<Form>{node}</Form>))
}

test('renders the API key as a required password input', async () => {
  await renderNode(<ApiKeyItem app={apiKeyApp} />)

  const input = container.querySelector('input')
  expect(input?.type).toBe('password')
  expect(input?.value).toBe('')
  expect(container.querySelector('label')?.textContent).toBe('Secret token')
  expect(container.textContent).toContain('Find it under Settings.')
  expect(container.textContent).not.toContain('A key is saved')
})

test('shows only the masked hint of a saved API key', async () => {
  await renderNode(
    <ApiKeyItem
      app={{
        ...apiKeyApp,
        auth: { type: 'apiKey' },
        integration: { appId: 'keyapp', status: 1, apiKeyHint: '••••WXYZ' }
      }}
    />
  )

  const input = container.querySelector('input')
  expect(container.querySelector('label')?.textContent).toBe('API key')
  expect(input?.value).toBe('')
  expect(input?.placeholder).toBe('••••WXYZ')
  expect(container.textContent).toContain('A key is saved (••••WXYZ). Leave this blank to keep it.')
})

const connections = [
  {
    id: 'c1',
    provider: 'example',
    providerName: 'Example',
    accountEmail: 'ann@example.com',
    connectedBy: 'Ann',
    status: 1,
    hasScopes: true
  },
  {
    id: 'c2',
    provider: 'example',
    providerName: 'Example',
    accountEmail: 'ben@example.com',
    connectedBy: 'Ben',
    status: 2,
    hasScopes: true
  },
  {
    id: 'c3',
    provider: 'example',
    providerName: 'Example',
    accountEmail: 'cat@example.com',
    connectedBy: 'Cat',
    status: 1,
    hasScopes: false
  }
]

test('asks to connect an OAuth2 account until the workspace has one', async () => {
  expect(needsAccountConnection(oauthApp)).toBe(true)
  expect(needsAccountConnection(oauthApp, [])).toBe(true)
  // Any of the workspace's accounts will do, whoever connected it
  expect(needsAccountConnection(oauthApp, connections)).toBe(false)
  expect(needsAccountConnection(apiKeyApp)).toBe(false)

  await act(async () => root.render(<ConnectAccount app={oauthApp} formId="form_1" />))
  expect(container.querySelector('button')?.textContent).toBe('Connect Example account')
})

test('asks to reconnect when the connection stopped working', async () => {
  const app = {
    ...oauthApp,
    integration: { appId: 'sheets', status: 3, connected: true, config: { sheet: 'a' } }
  }

  await act(async () => root.render(<ConnectAccount app={app} formId="form_1" />))
  expect(container.querySelector('button')?.textContent).toBe('Reconnect Example account')
  expect(container.textContent).toContain('Deliveries are paused')
})

test("labels each account with whose it is and whether it's usable", () => {
  const t = i18n.t.bind(i18n)

  expect(getConnectionLabel(t, oauthApp, connections[0])).toBe('ann@example.com (connected by Ann)')
  expect(getConnectionLabel(t, oauthApp, connections[1])).toBe(
    'ben@example.com (connected by Ben) · needs reconnecting'
  )
  expect(getConnectionLabel(t, oauthApp, connections[2])).toBe(
    "cat@example.com (connected by Cat) · doesn't allow Sheets yet"
  )
})

test('picks one of the workspace accounts or connects another', async () => {
  await renderNode(<ConnectionItem app={oauthApp} formId="form_1" connections={connections} />)

  // Radix renders the options into a hidden native select, after a blank one
  const options = [...container.querySelectorAll('option')]
    .filter(option => option.value)
    .map(option => [option.value, option.textContent, option.disabled])
  expect(options).toEqual([
    ['c1', 'ann@example.com (connected by Ann)', false],
    ['c2', 'ben@example.com (connected by Ben) · needs reconnecting', false],
    ['c3', "cat@example.com (connected by Cat) · doesn't allow Sheets yet", true]
  ])
  expect(container.querySelector('label')?.textContent).toBe('Account')
  expect(container.textContent).toContain('Accounts are shared with everyone in this workspace.')
  expect(container.textContent).toContain('Connect another Example account')
})

test('starts the picker on a usable account', () => {
  const [ann, ben, cat] = connections

  // The integration's own account, while the workspace still has it
  expect(
    getDefaultConnectionId({ ...oauthApp, integration: { connectionId: 'c2' } } as any, connections)
  ).toBe('c2')
  // Otherwise the first account that works, skipping ones needing reconnection
  expect(getDefaultConnectionId(oauthApp, [ben, ann])).toBe('c1')
  expect(
    getDefaultConnectionId({ ...oauthApp, integration: { connectionId: 'gone' } } as any, [
      cat,
      ben,
      ann
    ])
  ).toBe('c1')
  // One needing reconnection beats none; one without the app's access never
  expect(getDefaultConnectionId(oauthApp, [cat, ben])).toBe('c2')
  expect(getDefaultConnectionId(oauthApp, [cat])).toBeUndefined()
  expect(getDefaultConnectionId(oauthApp, [])).toBeUndefined()
})

test('lets a new account be saved without another change', () => {
  // A new integration, or one whose account is gone, starts with an account to save
  expect(startsOnNewAccount(oauthApp, 'c1')).toBe(true)
  expect(
    startsOnNewAccount({ ...oauthApp, integration: { connectionId: 'gone' } } as any, 'c1')
  ).toBe(true)
  // The integration's own account, or none, waits for a change
  expect(
    startsOnNewAccount({ ...oauthApp, integration: { connectionId: 'c1' } } as any, 'c1')
  ).toBe(false)
  expect(startsOnNewAccount(oauthApp, undefined)).toBe(false)
})

test('keeps the config the server stored, and closes even if reloading fails', async () => {
  const updateSettings = IntegrationService.updateSettings
  const integrations = FormService.integrations
  const saved: any[] = []

  // e.g. a spreadsheet the app created, in place of "create a new one"
  IntegrationService.updateSettings = (async (...args: any[]) => {
    saved.push(args)
    return { spreadsheet: 'stored' }
  }) as any
  FormService.integrations = (async () => {
    throw new Error('offline')
  }) as any

  try {
    useFormStore.setState({ integrations: [] } as any)
    useAppStore.getState().openModal('IntegrationSettingsModal')

    const app = { ...oauthApp, integration: { waitingCount: 2 } } as any
    await act(async () =>
      root.render(
        <MemoryRouter initialEntries={['/form/form_1']}>
          <Routes>
            <Route
              path="/form/:formId"
              element={<SettingsForm app={app} connections={connections as any} />}
            />
          </Routes>
        </MemoryRouter>
      )
    )

    // The account it starts on can be saved straight away
    const submit = container.querySelector<HTMLButtonElement>('[data-slot="submit-button"]')!
    expect(submit.disabled).toBe(false)
    await act(async () => submit.click())

    expect(saved).toEqual([['form_1', 'sheets', {}, undefined, 'c1']])
    expect(useFormStore.getState().integrations).toEqual([
      expect.objectContaining({ appId: 'sheets', config: { spreadsheet: 'stored' } })
    ])
    expect(useAppStore.getState().modals.has('IntegrationSettingsModal')).toBe(false)
  } finally {
    IntegrationService.updateSettings = updateSettings
    FormService.integrations = integrations
  }
})

test('offers to retry when the accounts fail to load', async () => {
  let retries = 0
  await act(async () => root.render(<ConnectionsLoadFailed onRetry={() => retries++} />))

  expect(container.textContent).toContain("Couldn't load the workspace's accounts.")
  await act(async () => container.querySelector('button')!.click())
  expect(retries).toBe(1)
})

test('lists the connected accounts in the workspace settings', async () => {
  const disconnected: string[] = []

  await act(async () =>
    root.render(
      <ConnectedAccountList
        connections={[
          {
            ...connections[0],
            forms: [
              { id: 'f1', name: 'Leads' },
              { id: 'f2', name: 'Survey' }
            ],
            canDisconnect: true
          },
          { ...connections[1], forms: [{ id: 'f3', name: 'Signups' }], canDisconnect: false },
          { ...connections[2], forms: [], canDisconnect: true }
        ]}
        onDisconnect={connection => disconnected.push(connection.id)}
      />
    )
  )

  const items = [...container.querySelectorAll('li')]
  expect(items.map(li => li.textContent)).toEqual([
    expect.stringContaining('Used by 2 forms: Leads, Survey'),
    expect.stringContaining('Used by 1 form: Signups'),
    expect.stringContaining('Not used by any form')
  ])
  expect(items[0].textContent).toContain('ann@example.com')
  expect(items[0].textContent).toContain('Connected by Ann')
  expect(items[0].textContent).toContain('Connected')
  expect(items[1].textContent).toContain('Needs reconnecting')

  // Only for the member who connected it, or the owner
  expect(items.map(li => !!li.querySelector('button'))).toEqual([true, false, true])
  await act(async () => items[0].querySelector('button')!.click())
  expect(disconnected).toEqual(['c1'])
})

test('says when the workspace has no connected accounts', async () => {
  await act(async () => root.render(<ConnectedAccountList connections={[]} />))
  expect(container.textContent).toBe(
    'No accounts are connected yet. Connect one from a form’s integrations.'
  )
})

test('builds the authorize URL for the form and app', () => {
  expect(getIntegrationAuthorizeUrl('form 1', 'sheets')).toBe(
    '/api/integrations/oauth/authorize?formId=form+1&appId=sheets'
  )
})

// --- delivery log -----------------------------------------------------------

test('lists delivery attempts with their outcome', async () => {
  const now = Math.floor(Date.now() / 1000)

  await act(async () =>
    root.render(
      <IntegrationRecordList
        records={[
          {
            id: 'r3',
            submissionId: 's2',
            status: 2,
            attempt: 3,
            maxAttempts: 3,
            willRetry: false,
            error: 'Response code 500 (Internal Server Error)',
            createdAt: now
          },
          {
            id: 'r2',
            submissionId: 's2',
            status: 2,
            attempt: 2,
            maxAttempts: 3,
            willRetry: true,
            error: 'Response code 502 (Bad Gateway)',
            createdAt: now - 60
          },
          {
            id: 'r1',
            submissionId: 's1',
            status: 1,
            attempt: 1,
            maxAttempts: 3,
            willRetry: false,
            createdAt: now - 3600
          }
        ]}
      />
    )
  )

  const items = [...container.querySelectorAll('li')].map(li => li.textContent)

  expect(items[0]).toContain('Failed')
  expect(items[0]).toContain('Attempt 3 of 3')
  expect(items[0]).toContain('Response code 500 (Internal Server Error)')
  expect(items[1]).toContain('Retrying')
  expect(items[1]).toContain('Attempt 2 of 3')
  expect(items[2]).toContain('Delivered')
  expect(items[2]).toContain('an hour ago')
  expect(items[2]).not.toContain('Attempt')
})

test('says when nothing has been sent yet', async () => {
  await act(async () => root.render(<IntegrationRecordList records={[]} />))
  expect(container.textContent).toBe('No submissions have been sent yet.')
})

test('shows submissions waiting for the account to be reconnected', async () => {
  const now = Math.floor(Date.now() / 1000)

  await act(async () =>
    root.render(
      <IntegrationRecordList
        records={[
          {
            id: 'r2',
            submissionId: 's2',
            status: 0,
            attempt: 0,
            maxAttempts: 3,
            willRetry: false,
            createdAt: now
          },
          {
            id: 'r1',
            submissionId: 's1',
            status: 0,
            attempt: 1,
            maxAttempts: 3,
            willRetry: false,
            error: 'Example rejected the token request: invalid_grant',
            createdAt: now - 60
          }
        ]}
      />
    )
  )

  const items = [...container.querySelectorAll('li')].map(li => li.textContent)

  expect(items[0]).toContain('Waiting')
  expect(items[0]).not.toContain('Failed')
  expect(items[1]).toContain('invalid_grant')
  // Not an attempt that failed, so no attempt count
  expect(items[1]).not.toContain('Attempt')
})

test('counts the submissions that are waiting', async () => {
  await act(async () => root.render(<IntegrationWaitingCount count={12} />))
  expect(container.textContent).toBe('12 submissions are waiting to be sent.')

  await act(async () => root.render(<IntegrationWaitingCount count={1} />))
  expect(container.textContent).toBe('1 submission is waiting to be sent.')

  await act(async () => root.render(<IntegrationWaitingCount count={0} />))
  expect(container.textContent).toBe('')

  await i18n.changeLanguage('zh-cn')
  await act(async () => root.render(<IntegrationWaitingCount count={3} />))
  expect(container.textContent).toBe('3 条提交等待发送。')
})

// --- loaded options and conditional settings ---------------------------------

const tabSetting: AppSettingType = {
  type: 'select',
  name: 'sheet',
  label: 'Tab',
  placeholder: 'First tab',
  required: false,
  loadsOptions: true,
  dependsOn: ['spreadsheet']
}

const wait = (ms: number) => act(() => new Promise(resolve => setTimeout(resolve, ms)))

type FormInstance = ReturnType<typeof Form.useForm>[0]

async function renderForm(initialValues: AnyMap, children: React.ReactNode) {
  let instance: FormInstance | undefined

  function Harness() {
    const [form] = Form.useForm()
    instance = form

    return (
      <Form form={form} initialValues={initialValues}>
        {children}
      </Form>
    )
  }

  await act(async () => root.render(<Harness />))
  return instance!
}

test('shows a setting only while the settings it depends on match', async () => {
  const existing: AppSettingType = {
    type: 'text',
    name: 'existing',
    label: 'Existing',
    required: true,
    visibleWhen: { createNew: false }
  }
  const form = await renderForm(
    {},
    <>
      <IntegrationSettingsItem
        setting={{ type: 'switch', name: 'createNew', label: 'Create', required: false }}
      />
      <VisibleSetting setting={existing}>
        <IntegrationSettingsItem setting={existing} />
      </VisibleSetting>
    </>
  )

  // A switch that hasn't been touched is off
  expect(container.textContent).toContain('Existing')

  await act(async () => form.setFieldsValue({ createNew: true }))
  expect(container.textContent).not.toContain('Existing')

  await act(async () => form.setFieldsValue({ createNew: false }))
  expect(container.textContent).toContain('Existing')

  expect(isSettingVisible(existing, { createNew: true })).toBe(false)
  expect(isSettingVisible({ ...existing, visibleWhen: { mode: 'new' } }, {})).toBe(false)
  expect(isSettingVisible({ ...existing, visibleWhen: undefined }, {})).toBe(true)
})

test('loads the options with the values in the form and the picked account', async () => {
  const load = vi.spyOn(IntegrationService, 'settingOptions').mockResolvedValue([
    { label: 'Responses', value: '0' },
    { label: 'Archive', value: '100' }
  ] as never)

  await renderForm(
    { connectionId: 'c1', spreadsheet: 'https://docs.google.com/x', sheet: '100' },
    <IntegrationSettingsItem formId="form_1" appId="sheets" setting={tabSetting} />
  )
  await wait(500)

  expect(load).toHaveBeenCalledTimes(1)
  expect(load).toHaveBeenCalledWith(
    'form_1',
    'sheets',
    'sheet',
    { spreadsheet: 'https://docs.google.com/x', sheet: '100' },
    undefined,
    'c1'
  )
  expect(container.querySelector('label')?.textContent).toBe('Tab')
  expect(container.querySelector('button[role="combobox"]')?.textContent).toContain('Archive')

  load.mockRestore()
})

test('reloads when a setting it depends on changes, and drops a value no longer offered', async () => {
  const load = vi
    .spyOn(IntegrationService, 'settingOptions')
    .mockResolvedValue([{ label: 'Archive', value: '100' }] as never)
  const form = await renderForm(
    { connectionId: 'c1', spreadsheet: 'first', sheet: '100' },
    <IntegrationSettingsItem formId="form_1" appId="sheets" setting={tabSetting} />
  )
  await wait(500)
  expect(load).toHaveBeenCalledTimes(1)

  // Not loaded while it's blank, and the picked tab is kept meanwhile
  await act(async () => form.setFieldsValue({ spreadsheet: '' }))
  await wait(500)
  expect(load).toHaveBeenCalledTimes(1)
  expect(form.getFieldValue('sheet')).toBe('100')

  load.mockResolvedValue([{ label: 'Sheet1', value: '0' }] as never)
  await act(async () => form.setFieldsValue({ spreadsheet: 'second' }))
  await wait(500)
  expect(load).toHaveBeenCalledTimes(2)
  expect(load.mock.calls[1][3]).toEqual({ spreadsheet: 'second', sheet: '100' })
  expect(form.getFieldValue('sheet')).toBeUndefined()

  // Picking another account loads them again
  await act(async () => form.setFieldsValue({ connectionId: 'c2' }))
  await wait(500)
  expect(load).toHaveBeenCalledTimes(3)
  expect(load.mock.calls[2][5]).toBe('c2')

  load.mockRestore()
})

test('says why the options could not be loaded', async () => {
  const load = vi
    .spyOn(IntegrationService, 'settingOptions')
    .mockRejectedValue(new Error("The spreadsheet wasn't found."))

  await renderForm(
    { spreadsheet: 'missing', sheet: '100' },
    <IntegrationSettingsItem formId="form_1" appId="sheets" setting={tabSetting} />
  )
  await wait(500)

  expect(container.querySelector('[data-slot="options-error"]')?.textContent).toBe(
    "The spreadsheet wasn't found."
  )

  load.mockRestore()
})

test('translates placeholders', () => {
  expect(getIntegrationSetting(i18n.t, app, tabSetting).placeholder).toBe('First tab')

  i18n.addResource(
    'en',
    'translation',
    'form.integrations.apps.example.settings.sheet.placeholder',
    'Default tab'
  )
  expect(getIntegrationSetting(i18n.t, app, tabSetting).placeholder).toBe('Default tab')
})

test('translates the Google Sheets settings', async () => {
  const sheetsApp = { ...app, id: 'googlesheets' } as IntegratedAppType
  const sheet = { ...tabSetting, description: 'Row 1 holds the column headers' }

  await i18n.changeLanguage('zh-cn')
  expect(getIntegrationSetting(i18n.t, sheetsApp, sheet)).toMatchObject({
    label: '工作表',
    placeholder: '第一个工作表',
    description: '第 1 行为列标题；每出现一个新问题，HeyForm 会添加一个标题。'
  })
})
