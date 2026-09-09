import * as assert from 'assert'
import 'reflect-metadata'

import { AIResolver } from '../src/resolver/form/ai.resolver'
import { PublishFormResolver } from '../src/resolver/form/publish-form.resolver'
import { UpdateFormSchemasResolver } from '../src/resolver/form/update-form-schemas.resolver'
import { htmlUtils } from '@heyform-inc/answer-utils'

type Field = Record<string, any>

const team = { id: 'team-1' } as any
const user = { id: 'user-1', hasPublishedForm: true } as any

function harness(content: string) {
  const creates: Field[] = []
  const updates: Field[] = []
  let stored: Field = {
    id: 'form-1',
    name: 'Existing form',
    _drafts: '[]',
    version: 0,
    settings: {}
  }
  const service = {
    create: async (input: Field) => {
      creates.push(input)
      stored = { ...input, id: 'form-1' }
      return stored.id
    },
    findById: async (id: string) => {
      assert.strictEqual(id, stored.id)
      return stored
    },
    update: async (id: string, input: Field) => {
      assert.strictEqual(id, stored.id)
      updates.push(input)
      stored = { ...stored, ...input }
      return true
    }
  }
  const ai = new AIResolver(
    {
      chatCompletion: async () => ({ choices: [{ message: { content } }] })
    } as any,
    service as any,
    { throttler: async () => undefined } as any
  )
  return {
    ai,
    creates,
    updates,
    getStored: () => stored,
    save: new UpdateFormSchemasResolver(service as any),
    publish: new PublishFormResolver(service as any, {} as any)
  }
}

// Mirrors the builder's serializeFields -> getFilteredFields conversion using the real
// answer-utils HTML parser/serializer, including nested group fields.
function serialize(nodes: any[]): string {
  // answer-utils adds link metadata to the input array while serializing.
  return htmlUtils.serialize(JSON.parse(JSON.stringify(nodes)))
}

function builderRoundTrip(fields: Field[]): Field[] {
  return fields.map(field => ({
    ...field,
    title: htmlUtils.parse(serialize(field.title)),
    description: htmlUtils.parse(serialize(field.description)),
    properties: {
      ...field.properties,
      ...(Array.isArray(field.properties?.fields)
        ? { fields: builderRoundTrip(field.properties.fields) }
        : {})
    }
  }))
}

async function saveAndPublish(flow: ReturnType<typeof harness>, fields: Field[]) {
  const drafts = builderRoundTrip(fields)
  const saved = await flow.save.updateFormSchemas({
    formId: 'form-1',
    version: 0,
    drafts
  } as any)
  assert.strictEqual(saved.version, 1)
  assert.deepStrictEqual(saved.drafts, fields, 'saving must preserve normalized content')
  assert.deepStrictEqual(JSON.parse(flow.getStored()._drafts), fields)

  assert.strictEqual(
    await flow.publish.publishForm(team, user, {
      formId: 'form-1',
      version: saved.version,
      drafts: builderRoundTrip(saved.drafts)
    } as any),
    true
  )
  assert.deepStrictEqual(flow.getStored().fields, fields, 'publishing must preserve content')
  assert.deepStrictEqual(JSON.parse(flow.getStored()._drafts), fields)
  assert.strictEqual(flow.getStored()['settings.active'], true)
  assert.strictEqual(flow.updates.length, 2)
  return flow.getStored().fields as Field[]
}

async function testRepairedCreateFormSurvivesBuilderSaveAndPublish() {
  const flow = harness(`\`\`\`json
  {name: ' AI survey ', fields: [
    {id: 'name', kind: 'short_text', title: [['p', 'Your name', null]],
      description: [['p', [null, 'Tell us ', ['b', 'more', null]], null]],},
    {id: 'group', kind: 'group', title: 'Contact', properties: {fields: [
      {id: 'email', kind: 'email', title: [['p', 'Email', null]], description: null},
    ]}},
  ],}
  \`\`\``)
  assert.strictEqual(
    await flow.ai.createFormWithAI(team, user, {
      projectId: 'project-1',
      topic: 'Survey'
    } as any),
    'form-1'
  )
  assert.strictEqual(flow.creates.length, 1)
  assert.strictEqual(flow.creates[0].name, 'AI survey')
  const fields = JSON.parse(flow.getStored()._drafts)
  assert.strictEqual(serialize(fields[0].title), '<p>Your name</p>')
  assert.strictEqual(serialize(fields[0].description), '<p>Tell us <b>more</b></p>')
  const published = await saveAndPublish(flow, fields)
  assert.strictEqual(serialize(published[1].properties.fields[0].title), '<p>Email</p>')
}

async function testRepairedAppendedFieldsSurviveBuilderSaveAndPublish() {
  const flow = harness(`[
    {id: 'consent', kind: 'legal_terms', title: [['p', 'Consent', null]],
      properties: {html: '<p>Accept the <b>terms</b>.</p>'}},
    {id: 'comment', kind: 'short_text', title: [['p', 'Comment', null]],
      description: [['p', 'Optional', null]]
  `)
  const fields = await flow.ai.createFieldsWithAI(
    team,
    user,
    flow.getStored() as any,
    {
      prompt: 'Add consent and comment'
    } as any
  )
  assert.strictEqual(flow.creates.length, 0)
  assert.strictEqual(serialize(fields[0].description as any[]), '<p>Accept the <b>terms</b>.</p>')
  const published = await saveAndPublish(flow, fields)
  assert.strictEqual(serialize(published[1].description), '<p>Optional</p>')
}

async function testLinksKeepTheirMeaningAcrossSaveAndPublish() {
  const flow = harness(
    JSON.stringify({
      fields: [
        {
          id: 'link',
          kind: 'short_text',
          title: [['a', 'Search', { href: 'https://example.com/?x=1&query="hello"' }]]
        }
      ]
    })
  )
  await flow.ai.createFormWithAI(team, user, { projectId: 'project-1', topic: 'Links' } as any)
  const fields = JSON.parse(flow.getStored()._drafts)
  assert.strictEqual(
    serialize(fields[0].title),
    '<a href="https://example.com/?x=1&amp;query=&quot;hello&quot;">Search</a>'
  )
  await saveAndPublish(flow, fields)
}

async function testInvalidResponsesFailBeforePersistence() {
  const badFields = [
    [],
    [{ kind: 'invented', title: 'Question' }],
    [{ kind: 'submit_date', title: 'Internal field' }],
    [{ kind: 'short_text', title: [['a', ['Go'], 'https://example.com']] }],
    [{ kind: 'short_text', description: [['p', 42, null]] }],
    [{ kind: 'short_text', title: [{ type: 'paragraph', content: 'Invalid node' }] }],
    [{ kind: 'short_text', title: [['p', 'Text', { id: { nested: true } }]] }]
  ]
  const responses = [
    ...badFields.map(fields => ({
      create: JSON.stringify({ fields }),
      append: JSON.stringify(fields)
    })),
    ...['null', '42', '"not a form"', '{}', '{:1}', '{"fields":[]} trailing prose'].map(
      content => ({
        create: content,
        append: content
      })
    )
  ]

  for (const [index, response] of responses.entries()) {
    const create = harness(response.create)
    await assert.rejects(
      () =>
        create.ai.createFormWithAI(team, user, { projectId: 'project-1', topic: 'Survey' } as any),
      /Failed to generate question object/,
      `create response ${index}`
    )
    assert.strictEqual(create.creates.length, 0)
    assert.strictEqual(create.updates.length, 0)

    const append = harness(response.append)
    await assert.rejects(
      () =>
        append.ai.createFieldsWithAI(
          team,
          user,
          append.getStored() as any,
          { prompt: 'More' } as any
        ),
      /Failed to create fields/,
      `append response ${index}`
    )
    assert.strictEqual(append.creates.length, 0)
    assert.strictEqual(append.updates.length, 0)
  }
}

async function run() {
  await testRepairedCreateFormSurvivesBuilderSaveAndPublish()
  await testRepairedAppendedFieldsSurviveBuilderSaveAndPublish()
  await testInvalidResponsesFailBeforePersistence()
  await testLinksKeepTheirMeaningAcrossSaveAndPublish()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
