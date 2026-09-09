import * as assert from 'assert'
import 'reflect-metadata'

import { AIResolver } from '../src/resolver/form/ai.resolver'
import { normalizeAIFields } from '../src/utils/ai-fields'

async function testEveryAIMutationConsumesUserAndTeamQuota(selfHosted = false) {
  const throttleCalls: unknown[][] = []
  const completions = [
    JSON.stringify({
      name: 'Generated form',
      fields: [{ id: 'field-1', kind: 'short_text', placeholder: 'invalid' }]
    }),
    JSON.stringify([{ id: 'field-2', kind: 'short_text', properties: { html: 'invalid' } }]),
    JSON.stringify([{ id: 'logic-1' }]),
    JSON.stringify({ fontFamily: 'Inter' })
  ]
  const openAIService = {
    chatCompletion: async () => ({
      choices: [
        {
          message: {
            content: completions.shift()
          }
        }
      ]
    })
  }
  const formService = {
    create: async (value: any) => {
      assert.deepStrictEqual(
        JSON.parse(value._drafts),
        normalizeAIFields([{ id: 'field-1', kind: 'short_text' }])
      )
      return 'generated-form-id'
    }
  }
  const redisService = {
    throttler: async (...args: unknown[]) => {
      throttleCalls.push(args)
    }
  }
  const resolver = new AIResolver(openAIService as any, formService as any, redisService as any)
  const team = {
    id: 'team-1',
    plan: {
      aiForm: true,
      themeCustomization: true
    }
  } as any
  if (selfHosted) delete team.plan
  const user = { id: 'user-1' } as any
  const form = {
    id: 'form-1',
    name: 'Existing form',
    _drafts: '[]',
    logics: []
  } as any

  await resolver.createFormWithAI(team, user, {
    projectId: 'project-1',
    topic: 'Security survey'
  } as any)
  assert.deepStrictEqual(
    await resolver.createFieldsWithAI(team, user, form, { prompt: 'Add a question' } as any),
    normalizeAIFields([{ id: 'field-2', kind: 'short_text' }])
  )
  await resolver.createFormLogicsWithAI(team, user, form, { prompt: 'Add logic' } as any)
  await resolver.createFormThemeWithAI(team, user, {
    prompt: 'Use blue',
    theme: {}
  } as any)

  assert.deepStrictEqual(throttleCalls, [
    ['ai:user:user-1', 20, '1h'],
    ['ai:team:team-1', 100, '1h'],
    ['ai:user:user-1', 20, '1h'],
    ['ai:team:team-1', 100, '1h'],
    ['ai:user:user-1', 20, '1h'],
    ['ai:team:team-1', 100, '1h'],
    ['ai:user:user-1', 20, '1h'],
    ['ai:team:team-1', 100, '1h']
  ])
}

async function testQuotaFailurePreventsOpenAIRequest() {
  let openAIRequests = 0
  const quotaError = new Error('quota exceeded')
  const resolver = new AIResolver(
    {
      chatCompletion: async () => {
        openAIRequests += 1
      }
    } as any,
    {} as any,
    {
      throttler: async () => {
        throw quotaError
      }
    } as any
  )

  await assert.rejects(
    () =>
      resolver.createFieldsWithAI(
        { id: 'team-1', plan: { aiForm: true } } as any,
        { id: 'user-1' } as any,
        { id: 'form-1', name: 'Form', _drafts: '[]' } as any,
        { prompt: 'Generate' } as any
      ),
    quotaError
  )
  assert.strictEqual(openAIRequests, 0)
}

async function testExplicitPlanRestrictions() {
  const resolver = new AIResolver({} as any, {} as any, {} as any)
  for (const plan of [{}, { aiForm: false }, { aiForm: true, themeCustomization: false }]) {
    const team = { id: 'team-1', plan } as any
    const user = { id: 'user-1' } as any
    if (!plan.aiForm) {
      await assert.rejects(() => resolver.createFormWithAI(team, user, {} as any), /Upgrade/)
      await assert.rejects(
        () => resolver.createFieldsWithAI(team, user, {} as any, {} as any),
        /Upgrade/
      )
      await assert.rejects(
        () => resolver.createFormLogicsWithAI(team, user, {} as any, {} as any),
        /Upgrade/
      )
    }
    await assert.rejects(() => resolver.createFormThemeWithAI(team, user, {} as any), /Upgrade/)
  }
}

async function testInvalidAIFieldsAreRejected() {
  let created = false
  const resolver = new AIResolver(
    {
      chatCompletion: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                name: 42,
                fields: [{ kind: 'invented' }]
              })
            }
          }
        ]
      })
    } as any,
    {
      create: async () => {
        created = true
      }
    } as any,
    { throttler: async () => undefined } as any
  )
  await assert.rejects(
    () =>
      resolver.createFormWithAI(
        { id: 'team-1' } as any,
        { id: 'user-1' } as any,
        { projectId: 'project-1', topic: 'Survey' } as any
      ),
    /Failed to generate question object/
  )
  assert.strictEqual(created, false)
}

async function run() {
  await testExplicitPlanRestrictions()
  await testInvalidAIFieldsAreRejected()
  await testEveryAIMutationConsumesUserAndTeamQuota(true)
  await testEveryAIMutationConsumesUserAndTeamQuota()
  await testQuotaFailurePreventsOpenAIRequest()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
