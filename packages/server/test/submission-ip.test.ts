import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import * as assert from 'assert'

import { SubmissionsResolver } from '../src/resolver/submission/submissions.resolver'
import { ExportFileService } from '../src/service/export-file.service'
import { isSubmissionIpVisible } from '../src/utils/submission'

import { webhookPayload } from '../src/apps/webhook'

const shown = { id: 'form_1', name: 'Form', fields: [], settings: { displayIpAddress: true } }
const hidden = { id: 'form_1', name: 'Form', fields: [], settings: {} }

const submission = {
  id: 'submission_1',
  answers: [{ id: 'name', kind: FieldKindEnum.SHORT_TEXT, title: 'Name', value: 'Ada' }],
  hiddenFields: [],
  variables: [],
  startAt: 1_700_000_000,
  endAt: 1_700_000_060,
  ip: '203.0.113.10'
}

function testIpIsHiddenUnlessTheFormShowsIt() {
  assert.strictEqual(isSubmissionIpVisible(hidden), false)
  assert.strictEqual(isSubmissionIpVisible({ settings: { displayIpAddress: false } }), false)
  assert.strictEqual(isSubmissionIpVisible(shown), true)
}

async function testSubmissionsLoadTheIpOnlyWhenShown() {
  const requests: Record<string, any>[] = []
  const resolver = new SubmissionsResolver({
    count: async () => 1,
    findAll: async (options: Record<string, any>) => {
      requests.push(options)
      return [submission]
    }
  } as any)

  await resolver.submissions({} as any, hidden as any, { formId: 'form_1' } as any)
  await resolver.submissions({} as any, shown as any, { formId: 'form_1' } as any)

  assert.deepStrictEqual(
    requests.map(request => request.withIp),
    [false, true]
  )
}

async function testCsvHasAnIpColumnOnlyWhenAsked() {
  const fields = [{ id: 'name', kind: FieldKindEnum.SHORT_TEXT, title: 'Name' }]
  const without = await new ExportFileService().csv(fields as any, [], [submission as any])
  const withIp = await new ExportFileService().csv(fields as any, [], [submission as any], true)

  assert.ok(!without.includes('IP Address'))
  assert.ok(!without.includes('203.0.113.10'))
  assert.ok(withIp.split('\n')[0].endsWith('"IP Address"'))
  assert.ok(withIp.split('\n')[1].endsWith('"203.0.113.10"'))
}

function testWebhookSendsTheIpOnlyWhenShown() {
  assert.ok(!('ip' in webhookPayload(submission as any, hidden as any)))
  assert.strictEqual(webhookPayload(submission as any, shown as any).ip, '203.0.113.10')
}

async function run() {
  testIpIsHiddenUnlessTheFormShowsIt()
  await testSubmissionsLoadTheIpOnlyWhenShown()
  await testCsvHasAnIpColumnOnlyWhenAsked()
  testWebhookSendsTheIpOnlyWhenShown()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
