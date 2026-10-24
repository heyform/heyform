import * as assert from 'assert'
import got from 'got'
import 'reflect-metadata'

import { TemplateDetailResolver } from '../src/resolver/template/template-detail.resolver'
import { TemplatesResolver } from '../src/resolver/template/templates.resolver'
import { UseTemplateResolver } from '../src/resolver/template/use-template.resolver'
import {
  TEMPLATE_DETAIL_BASE_URL,
  TEMPLATE_SUMMARY_URL,
  TemplateService
} from '../src/service/template.service'

async function main() {
  const remote = {
    id: 'template',
    name: 'Survey',
    slug: 'survey',
    category: 'Employee & Job',
    thumbnailUrl: 'https://example.com/thumbnail.png',
    fields: [{ id: 'question', kind: 'short_text' }]
  }
  const originalGet = got.get
  let requests = 0
  let fail = false
  let response: unknown = [remote]
  const urls: string[] = []
  got.get = ((url: string) => ({
    json: async () => {
      requests++
      urls.push(url)
      if (fail) throw new Error('offline')
      if (!Array.isArray(response)) return response
      if (url === TEMPLATE_SUMMARY_URL) return response.map(({ fields, ...summary }) => summary)
      const row = response.find(item => url === `${TEMPLATE_DETAIL_BASE_URL}${item.id}.json`)
      if (!row) throw Object.assign(new Error('not found'), { response: { statusCode: 404 } })
      return row
    }
  })) as unknown as typeof got.get
  try {
    const service = new TemplateService()
    const [catalog, concurrent] = await Promise.all([service.findAll(), service.findAll()])
    assert.strictEqual(requests, 1)
    assert.strictEqual(catalog, concurrent)
    const summary = catalog[0]
    assert.deepStrictEqual(urls, [TEMPLATE_SUMMARY_URL])
    assert.deepStrictEqual(summary.fields, [])
    const template = summary
    assert.strictEqual(template.thumbnail, remote.thumbnailUrl)
    assert.strictEqual(template.category, 'Employee/Job')
    assert.strictEqual(typeof template.kind, 'number')
    assert.deepStrictEqual(await service.findAll('SURVEY', 1), [template])
    assert.deepStrictEqual(await service.findAll('missing'), [])
    const list = new TemplatesResolver(service)
    const detail = new TemplateDetailResolver(service)
    assert.deepStrictEqual(await list.templates(), [template])
    const [full, concurrentDetail] = await Promise.all([
      detail.templateDetail({ templateId: 'template' }),
      detail.templateDetail({ templateId: 'template' })
    ])
    assert.strictEqual(full, concurrentDetail)
    assert.deepStrictEqual(full.fields, remote.fields)
    assert.deepStrictEqual(urls, [TEMPLATE_SUMMARY_URL, `${TEMPLATE_DETAIL_BASE_URL}template.json`])
    assert.strictEqual(await detail.templateDetail({ templateSlug: 'survey' }), full)
    await assert.rejects(detail.templateDetail({ templateSlug: 'missing' }), /does not exist/)
    await assert.rejects(detail.templateDetail({}), /ID or slug is required/)

    let created: any
    const use = new UseTemplateResolver(
      {
        create: async form => {
          created = form
          return 'new-form'
        }
      } as any,
      service
    )
    assert.strictEqual(
      await use.useTemplate({ id: 'team' } as any, { id: 'user' } as any, {
        projectId: 'project',
        templateId: 'template'
      }),
      'new-form'
    )
    assert.deepStrictEqual(JSON.parse(created._drafts), remote.fields)
    assert.strictEqual(created.projectId, 'project')
    await assert.rejects(
      use.useTemplate({ id: 'team' } as any, { id: 'user' } as any, {
        projectId: 'project',
        templateId: 'missing'
      }),
      /does not exist/
    )

    assert.strictEqual(requests, 3)
    assert.strictEqual(await service.findById('../list_all'), null)
    assert.strictEqual(requests, 3)
    fail = true
    await assert.rejects(new TemplateService().findAll(), /Unable to load/)
    const realNow = Date.now
    Date.now = () => realNow() + 6 * 60 * 1000
    try {
      assert.deepStrictEqual(await service.findAll(), [template])
      assert.strictEqual(await service.findById('template'), full)
    } finally {
      Date.now = realNow
    }
    await assert.rejects(new TemplateService().findById('template'), /Unable to load/)
    fail = false
    response = { error: 'invalid catalog' }
    await assert.rejects(new TemplateService().findAll(), /Unable to load/)
    await assert.rejects(new TemplateService().findById('template'), /Unable to load/)
    response = { ...remote, id: 'wrong-id' }
    await assert.rejects(new TemplateService().findById('template'), /Unable to load/)
    console.log('Remote template listing, caching, previews, creation and failure handling passed')
  } finally {
    got.get = originalGet
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
