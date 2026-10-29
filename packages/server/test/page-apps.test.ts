import * as assert from 'assert'

import { validateAppConfig } from '../src/apps/validate-config'
import { IntegrationStatusEnum } from '../src/model/integration.model'
import { AppsResolver } from '../src/resolver/apps/apps.resolver'
import { AppService } from '../src/service/app.service'
import { IntegrationService } from '../src/service/integration.service'

import privatusanalytics, { normalizeSiteId } from '../src/apps/privatusanalytics'
import { AppError, defineApp } from '../src/apps/types'
import webhook from '../src/apps/webhook'

const FORM = { id: 'form-1' } as any

function pageApp(page = (config: any) => ({ siteId: config.siteId })) {
  return defineApp({
    id: 'pageonly',
    name: 'Page only',
    description: 'Runs on the form page',
    icon: '/static/pageonly.png',
    settings: [{ type: 'text', name: 'siteId', label: 'Site ID', required: true }],
    page
  })
}

// --- defineApp --------------------------------------------------------------

function testAnAppNeedsRunOrPage() {
  assert.throws(
    () =>
      defineApp({
        id: 'empty',
        name: 'Empty',
        description: 'Does nothing',
        icon: '/static/empty.png',
        settings: []
      }),
    /App empty: needs run, page or both/
  )

  assert.strictEqual(typeof pageApp().page, 'function')
  assert.strictEqual(pageApp().run, undefined)
}

function testPageAppsCantStoreCredentials() {
  assert.throws(
    () =>
      defineApp({
        id: 'secret',
        name: 'Secret',
        description: 'Would leak its key',
        icon: '/static/secret.png',
        auth: { type: 'apiKey' },
        settings: [],
        page: () => ({})
      }),
    /App secret: page apps can't use apiKey auth/
  )
}

// --- Privatus Analytics ------------------------------------------------------

function testPrivatusDefinition() {
  assert.strictEqual(privatusanalytics.id, 'privatusanalytics')
  assert.deepStrictEqual(privatusanalytics.auth, { type: 'none' })
  assert.strictEqual(privatusanalytics.run, undefined)
  assert.deepStrictEqual(
    privatusanalytics.settings.map(setting => [setting.name, setting.type, setting.required]),
    [['siteId', 'text', true]]
  )
}

function testNormalizesSiteIds() {
  assert.strictEqual(normalizeSiteId('pa_Z6RY7F45OA'), 'pa_Z6RY7F45OA')
  assert.strictEqual(normalizeSiteId('  pa_abc123 \n'), 'pa_abc123')

  for (const value of [
    '',
    'pa_',
    'Z6RY7F45OA',
    'pa_abc"><script>alert(1)</script>',
    'pa_abc def',
    'pa_ab-c',
    `pa_${'a'.repeat(65)}`,
    123,
    undefined
  ]) {
    assert.throws(
      () => normalizeSiteId(value),
      (error: unknown) => error instanceof AppError && !error.retryable,
      `accepted ${JSON.stringify(value)}`
    )
  }
}

async function testSavingTrimsTheSiteId() {
  const config = await validateAppConfig(
    privatusanalytics,
    { siteId: ' pa_Z6RY7F45OA ', extra: 'dropped' },
    { form: FORM }
  )

  assert.deepStrictEqual(config, { siteId: 'pa_Z6RY7F45OA' })
}

async function testSavingRejectsABadSiteId() {
  await assert.rejects(
    validateAppConfig(privatusanalytics, { siteId: 'UA-12345-6' }, { form: FORM }),
    /Enter a site ID that starts with pa_/
  )
}

function testPageGetsOnlyTheSiteId() {
  assert.deepStrictEqual(privatusanalytics.page!({ siteId: 'pa_Z6RY7F45OA', other: 'x' }), {
    siteId: 'pa_Z6RY7F45OA'
  })
  assert.throws(() => privatusanalytics.page!({ siteId: 'nope' }))
}

// --- IntegrationService ------------------------------------------------------

function createService(apps: Record<string, any>, integrations: any[]) {
  const queries: any[] = []
  const integrationModel: any = {
    find: async (filter: any) => {
      queries.push(filter)
      return integrations.filter(
        row =>
          row.formId === filter.formId &&
          (!filter.appId || filter.appId.$in.includes(row.appId)) &&
          (filter.status === undefined ||
            (filter.status.$in
              ? filter.status.$in.includes(row.status)
              : row.status === filter.status))
      )
    }
  }
  const appService = new AppService()
  ;(appService as any).apps = apps

  const added: any[] = []
  const queue: any = { add: async (data: any) => added.push(data) }
  const service = new IntegrationService(integrationModel, {} as any, appService, queue, {
    add: async () => undefined
  } as any)

  return { service, queries, added }
}

async function testFindsPageConfigsOfActiveIntegrations() {
  const broken = {
    ...pageApp(() => {
      throw new Error('bad config')
    }),
    id: 'broken'
  }
  const { service, queries } = createService({ webhook, privatusanalytics, broken }, [
    {
      id: 'i1',
      formId: 'form-1',
      appId: 'privatusanalytics',
      status: IntegrationStatusEnum.ACTIVE,
      config: new Map([['siteId', 'pa_Z6RY7F45OA']])
    },
    {
      id: 'i2',
      formId: 'form-1',
      appId: 'webhook',
      status: IntegrationStatusEnum.ACTIVE,
      config: new Map([['endpointUrl', 'https://example.com/secret-hook']])
    },
    {
      id: 'i3',
      formId: 'form-1',
      appId: 'broken',
      status: IntegrationStatusEnum.ACTIVE,
      config: new Map()
    },
    {
      id: 'i4',
      formId: 'form-2',
      appId: 'privatusanalytics',
      status: IntegrationStatusEnum.DISABLED,
      config: new Map([['siteId', 'pa_other']])
    }
  ])

  // Never the webhook's URL, and a page() that throws is left out
  assert.deepStrictEqual(await service.findPageConfigs('form-1'), {
    privatusanalytics: { siteId: 'pa_Z6RY7F45OA' }
  })
  assert.deepStrictEqual(queries[0].appId, { $in: ['privatusanalytics', 'broken'] })

  // Turned off
  assert.deepStrictEqual(await service.findPageConfigs('form-2'), {})
}

async function testNoQueryWithoutPageApps() {
  const { service, queries } = createService({ webhook }, [])

  assert.deepStrictEqual(await service.findPageConfigs('form-1'), {})
  assert.strictEqual(queries.length, 0)
}

async function testPageAppsGetNoDeliveryJobs() {
  const { service, added } = createService({ webhook, privatusanalytics }, [
    {
      id: 'i1',
      formId: 'form-1',
      appId: 'privatusanalytics',
      status: IntegrationStatusEnum.ACTIVE,
      config: new Map([['siteId', 'pa_Z6RY7F45OA']])
    },
    {
      id: 'i2',
      formId: 'form-1',
      appId: 'webhook',
      status: IntegrationStatusEnum.ACTIVE,
      config: new Map([['endpointUrl', 'https://example.com/hook']])
    }
  ])

  await service.addQueue({ id: 'form-1', settings: {} } as any, 'submission-1')

  assert.deepStrictEqual(
    added.map(job => job.appId),
    ['webhook']
  )
}

// --- apps query --------------------------------------------------------------

async function testAppsQuerySaysWhichAppsDeliverSubmissions() {
  const appService = new AppService()
  ;(appService as any).apps = { webhook, privatusanalytics }

  const apps = await new AppsResolver(appService).apps()

  assert.deepStrictEqual(
    apps.map(app => [app.id, app.deliversSubmissions]),
    [
      ['webhook', true],
      ['privatusanalytics', false]
    ]
  )
}

async function run() {
  testAnAppNeedsRunOrPage()
  testPageAppsCantStoreCredentials()
  testPrivatusDefinition()
  testNormalizesSiteIds()
  await testSavingTrimsTheSiteId()
  await testSavingRejectsABadSiteId()
  testPageGetsOnlyTheSiteId()
  await testFindsPageConfigsOfActiveIntegrations()
  await testNoQueryWithoutPageApps()
  await testPageAppsGetNoDeliveryJobs()
  await testAppsQuerySaysWhichAppsDeliverSubmissions()
}

if (require.main === module) {
  run().catch(error => {
    process.stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : error}\n`)
    process.exitCode = 1
  })
}
