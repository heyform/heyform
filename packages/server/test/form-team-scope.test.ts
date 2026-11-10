import { FormStatusEnum } from '@heyform-inc/shared-types-enums'
import assert from 'assert'

import { FormService } from '../src/service/form.service'

// Records the conditions each query is built with, and resolves to no documents
function createService() {
  const queries: Record<string, any>[] = []

  const formModel = {
    find: (conditions: Record<string, any>) => {
      queries.push(conditions)

      return {
        sort: () => ({
          limit: async () => [],
          then: (resolve: (rows: any[]) => void) => resolve([])
        })
      }
    }
  }

  const service = new FormService(formModel as any, {} as any, {} as any, {} as any)

  return { service, queries }
}

// A member who joined a workspace through the invite link belongs to no project. The team-level
// queries must then return nothing instead of every form in the workspace.
async function testRecentFormsOfAMemberWithoutProjects() {
  const { service, queries } = createService()

  assert.deepStrictEqual(await service.findRecentInTeam('team_1', []), [])
  assert.deepStrictEqual(queries, [])
}

async function testSearchOfAMemberWithoutProjects() {
  const { service, queries } = createService()

  assert.deepStrictEqual(await service.searchInTeam('team_1', [], ''), [])
  assert.deepStrictEqual(await service.searchInTeam('team_1', [], 'finance'), [])
  assert.deepStrictEqual(queries, [])
}

async function testRecentFormsStayInsideTheCallersProjects() {
  const { service, queries } = createService()

  await service.findRecentInTeam('team_1', ['project_1', 'project_2'], 20)

  assert.deepStrictEqual(queries, [
    {
      teamId: 'team_1',
      status: FormStatusEnum.NORMAL,
      projectId: { $in: ['project_1', 'project_2'] }
    }
  ])
}

async function testSearchStaysInsideTheCallersProjects() {
  const { service, queries } = createService()

  await service.searchInTeam('team_1', ['project_1'], '')

  assert.deepStrictEqual(queries, [
    {
      teamId: 'team_1',
      projectId: { $in: ['project_1'] },
      name: /(?:)/i
    }
  ])
}

// Every query these methods build names the projects, whatever the caller passes
async function testEveryQueryIsScopedToProjects() {
  const { service, queries } = createService()

  await service.findRecentInTeam('team_1', ['project_1'])
  await service.searchInTeam('team_1', ['project_1'], 'finance')

  assert.strictEqual(queries.length, 2)

  for (const conditions of queries) {
    assert.deepStrictEqual(conditions.projectId, { $in: ['project_1'] })
  }
}

async function run() {
  await testRecentFormsOfAMemberWithoutProjects()
  await testSearchOfAMemberWithoutProjects()
  await testRecentFormsStayInsideTheCallersProjects()
  await testSearchStaysInsideTheCallersProjects()
  await testEveryQueryIsScopedToProjects()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
