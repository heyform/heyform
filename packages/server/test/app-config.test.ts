import { BadRequestException } from '@nestjs/common'
import * as assert from 'assert'

import { validateAppConfig } from '../src/apps/validate-config'
import { UpdateIntegrationSettingsResolver } from '../src/resolver/integration/update-integration-settings.resolver'
import { AppService } from '../src/service/app.service'

import { AppConfig, defineApp } from '../src/apps/types'
import webhook from '../src/apps/webhook'

function createApp(validate?: (config: AppConfig) => Promise<void>) {
  return defineApp({
    id: 'example',
    name: 'Example',
    description: 'Example app',
    icon: '/static/example.png',
    settings: [
      { type: 'text', name: 'title', label: 'Title', required: true },
      { type: 'url', name: 'link', label: 'Link' },
      { type: 'textarea', name: 'note', label: 'Note', defaultValue: 'Hello' },
      {
        type: 'select',
        name: 'format',
        label: 'Format',
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'Form data', value: 'form' }
        ],
        defaultValue: 'json'
      },
      { type: 'switch', name: 'enabled', label: 'Enabled' }
    ],
    validate,
    run: async () => undefined
  })
}

async function assertBadRequest(promise: Promise<unknown>, message: RegExp) {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(error instanceof BadRequestException, `expected BadRequestException, got ${error}`)
    assert.match(error.message, message)
    return true
  })
}

// --- defineApp --------------------------------------------------------------

function testDefineAppFillsDefaults() {
  const app = createApp()

  assert.deepStrictEqual(app.auth, { type: 'none' })
  assert.deepStrictEqual(
    app.settings.map(setting => setting.required),
    [true, false, false, false, false]
  )
}

// --- generic validation -----------------------------------------------------

async function testAppliesDefaultsAndStripsUnknownKeys() {
  const config = await validateAppConfig(createApp(), {
    title: 'Leads',
    extra: 'dropped'
  })

  assert.deepStrictEqual(config, {
    title: 'Leads',
    note: 'Hello',
    format: 'json',
    enabled: false
  })
}

async function testKeepsValidValues() {
  const input = {
    title: 'Leads',
    link: 'https://example.com/path',
    note: 'Line 1\nLine 2',
    format: 'form',
    enabled: true
  }

  assert.deepStrictEqual(await validateAppConfig(createApp(), input), input)
}

async function testRejectsMissingRequiredValue() {
  for (const title of [undefined, null, '', '   ']) {
    await assertBadRequest(validateAppConfig(createApp(), { title }), /^Title is required$/)
  }
}

async function testIgnoresInheritedValues() {
  await assertBadRequest(
    validateAppConfig(createApp(), Object.create({ title: 'Inherited' })),
    /^Title is required$/
  )
}

async function testRejectsWrongTypes() {
  await assertBadRequest(validateAppConfig(createApp(), { title: 42 }), /Title must be text/)
  await assertBadRequest(
    validateAppConfig(createApp(), { title: 'Leads', note: ['x'] }),
    /Note must be text/
  )
  await assertBadRequest(
    validateAppConfig(createApp(), { title: 'Leads', enabled: 'true' }),
    /Enabled must be true or false/
  )
}

async function testRejectsInvalidUrl() {
  for (const link of ['not a url', 'ftp://example.com/file', 'javascript:alert(1)', 42]) {
    await assertBadRequest(
      validateAppConfig(createApp(), { title: 'Leads', link }),
      /Link must be a valid http\(s\) URL/
    )
  }
}

async function testRejectsSelectValueOutsideOptions() {
  for (const format of ['xml', 'JSON', 1]) {
    await assertBadRequest(
      validateAppConfig(createApp(), { title: 'Leads', format }),
      /Format must be one of the available options/
    )
  }
}

async function testRejectsNonObjectConfig() {
  for (const config of [null, undefined, 'x', ['title']]) {
    await assertBadRequest(validateAppConfig(createApp(), config), /Invalid integration config/)
  }
}

async function testRunsAppValidateOnNormalizedConfig() {
  const calls: AppConfig[] = []
  const app = createApp(async config => {
    calls.push(config)

    if (config.title === 'reject') {
      throw new BadRequestException('Rejected by app')
    }
  })

  await validateAppConfig(app, { title: 'Leads', extra: true })
  assert.deepStrictEqual(calls, [{ title: 'Leads', note: 'Hello', format: 'json', enabled: false }])

  await assertBadRequest(validateAppConfig(app, { title: 'reject' }), /Rejected by app/)

  // The app's hook only sees configs that passed the generic checks
  await assertBadRequest(validateAppConfig(app, { title: '' }), /Title is required/)
  assert.strictEqual(calls.length, 2)
}

// --- webhook ----------------------------------------------------------------

function testWebhookDefinitionIsUnchanged() {
  assert.strictEqual(webhook.id, 'webhook')
  assert.deepStrictEqual(webhook.auth, { type: 'none' })
  assert.deepStrictEqual(webhook.settings, [
    {
      type: 'url',
      name: 'endpointUrl',
      label: 'Endpoint URL',
      placeholder: 'https://webhook.example.com',
      required: true
    }
  ])
}

async function testWebhookRejectsPrivateEndpoint() {
  await assertBadRequest(
    validateAppConfig(webhook, { endpointUrl: 'http://10.0.0.1/hook' }),
    /Private network URLs are not allowed/
  )
}

async function testWebhookAcceptsPublicEndpoint() {
  assert.deepStrictEqual(
    await validateAppConfig(webhook, { endpointUrl: 'https://93.184.215.14/hook', fields: [[]] }),
    { endpointUrl: 'https://93.184.215.14/hook' }
  )
}

// --- resolver ---------------------------------------------------------------

function createResolver() {
  const saved: Array<{ formId: string; appId: string; updates: Record<string, any> }> = []
  const integrationService = {
    findOne: async () => null,
    createOrUpdate: async (formId: string, appId: string, updates: Record<string, any>) => {
      saved.push({ formId, appId, updates })
      return 'integration_1'
    },
    resendWaiting: async () => 0
  }
  const resolver = new UpdateIntegrationSettingsResolver(
    new AppService(),
    integrationService as any,
    {} as any
  )

  return { resolver, saved }
}

async function testResolverRejectsUnknownApp() {
  const { resolver, saved } = createResolver()

  for (const appId of ['unknown', 'constructor', '__proto__']) {
    await assertBadRequest(
      resolver.updateIntegrationSettings({
        formId: 'form_1',
        appId,
        config: { endpointUrl: 'https://93.184.215.14/hook' }
      }),
      /The app does not exist/
    )
  }

  assert.strictEqual(saved.length, 0)
}

async function testResolverSavesValidatedConfig() {
  const { resolver, saved } = createResolver()

  assert.strictEqual(
    await resolver.updateIntegrationSettings({
      formId: 'form_1',
      appId: 'webhook',
      config: { endpointUrl: 'https://93.184.215.14/hook', extra: 'dropped' }
    }),
    true
  )
  assert.deepStrictEqual(saved, [
    {
      formId: 'form_1',
      appId: 'webhook',
      updates: { config: { endpointUrl: 'https://93.184.215.14/hook' }, status: 1 }
    }
  ])
}

async function testResolverRejectsInvalidConfigWithoutSaving() {
  const { resolver, saved } = createResolver()

  await assertBadRequest(
    resolver.updateIntegrationSettings({
      formId: 'form_1',
      appId: 'webhook',
      config: { endpointUrl: 'http://169.254.169.254/latest/meta-data/' }
    }),
    /Private network URLs are not allowed/
  )
  await assertBadRequest(
    resolver.updateIntegrationSettings({
      formId: 'form_1',
      appId: 'webhook',
      config: { other: 'value' }
    }),
    /Endpoint URL is required/
  )
  assert.strictEqual(saved.length, 0)
}

async function run() {
  testDefineAppFillsDefaults()
  await testAppliesDefaultsAndStripsUnknownKeys()
  await testKeepsValidValues()
  await testRejectsMissingRequiredValue()
  await testIgnoresInheritedValues()
  await testRejectsWrongTypes()
  await testRejectsInvalidUrl()
  await testRejectsSelectValueOutsideOptions()
  await testRejectsNonObjectConfig()
  await testRunsAppValidateOnNormalizedConfig()
  testWebhookDefinitionIsUnchanged()
  await testWebhookRejectsPrivateEndpoint()
  await testWebhookAcceptsPublicEndpoint()
  await testResolverRejectsUnknownApp()
  await testResolverSavesValidatedConfig()
  await testResolverRejectsInvalidConfigWithoutSaving()
}

if (require.main === module) {
  run().catch(error => {
    process.stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : error}\n`)
    process.exitCode = 1
  })
}
