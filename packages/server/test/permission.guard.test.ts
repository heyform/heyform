import { Reflector } from '@nestjs/core'
import assert from 'assert'
import 'reflect-metadata'

import { PermissionGuard, PermissionScopeEnum } from '../src/common/guard/permission.guard'

function createGraphqlExecutionContext({
  handler,
  req,
  input
}: {
  handler: Function
  req: Record<string, any>
  input: Record<string, any>
}) {
  return {
    getType: () => 'graphql',
    getArgs: () => [{}, { input }, { req }, {}],
    getClass: () => class TestResolver {},
    getHandler: () => handler,
    switchToHttp: () => ({
      getRequest: () => req
    })
  } as any
}

function createHttpExecutionContext({
  handler,
  req
}: {
  handler: Function
  req: Record<string, any>
}) {
  return {
    getType: () => 'http',
    getArgs: () => [],
    getClass: () => class TestController {},
    getHandler: () => handler,
    switchToHttp: () => ({
      getRequest: () => req
    })
  } as any
}

function createGuard({
  team,
  member,
  project = null,
  projectMember = null,
  form = null
}: {
  team: Record<string, any> | null
  member: Record<string, any> | null
  project?: Record<string, any> | null
  projectMember?: Record<string, any> | null
  form?: Record<string, any> | null
}) {
  const teamService = {
    findById: async () => team,
    findMemberById: async () => member,
    updateMember: async () => true
  }

  const projectService = {
    findById: async () => project,
    findMemberById: async () => projectMember
  }

  const formService = {
    findById: async () => form
  }

  return new PermissionGuard(
    new Reflector(),
    teamService as any,
    projectService as any,
    formService as any
  )
}

async function testCollaboratorCanPassTeamGuard() {
  const handler = () => {}
  Reflect.defineMetadata('scope', PermissionScopeEnum.team, handler)

  const guard = createGuard({
    team: {
      id: 'team_1',
      ownerId: 'owner_1',
      name: 'Workspace A',
      storageQuota: 0,
      inviteCode: 'invite_1',
      toObject: () => ({})
    },
    member: {
      role: 'collaborator'
    }
  })

  const req: Record<string, any> = {
    user: {
      id: 'user_collaborator'
    }
  }

  const context = createGraphqlExecutionContext({
    handler,
    req,
    input: {
      teamId: 'team_1'
    }
  })

  const allowed = await guard.canActivate(context)

  assert.strictEqual(allowed, true)
  assert.strictEqual(req.team.isOwner, false)
  assert.strictEqual(req.team.id, 'team_1')
}

async function testNonMemberIsRejected() {
  const handler = () => {}
  Reflect.defineMetadata('scope', PermissionScopeEnum.team, handler)

  const guard = createGuard({
    team: {
      id: 'team_1',
      ownerId: 'owner_1',
      name: 'Workspace A',
      storageQuota: 0,
      inviteCode: 'invite_1',
      toObject: () => ({})
    },
    member: null
  })

  const req: Record<string, any> = {
    user: {
      id: 'user_not_in_team'
    }
  }

  const context = createGraphqlExecutionContext({
    handler,
    req,
    input: {
      teamId: 'team_1'
    }
  })

  await assert.rejects(
    async () => guard.canActivate(context),
    (error: any) => error?.message === "You don't have permission to access the workspace"
  )
}

async function testHttpFormGuardReadsRequestQuery() {
  const handler = () => {}
  Reflect.defineMetadata('scope', PermissionScopeEnum.form, handler)

  const guard = createGuard({
    team: {
      id: 'team_1',
      ownerId: 'owner_1',
      name: 'Workspace A',
      storageQuota: 0,
      inviteCode: 'invite_1',
      toObject: () => ({})
    },
    member: {
      role: 'collaborator'
    },
    project: {
      id: 'project_1',
      teamId: 'team_1',
      ownerId: 'owner_1',
      toObject: () => ({
        teamId: 'team_1',
        ownerId: 'owner_1'
      })
    },
    projectMember: {
      role: 'collaborator'
    },
    form: {
      teamId: 'team_1',
      projectId: 'project_1',
      toObject: () => ({
        teamId: 'team_1',
        projectId: 'project_1'
      })
    }
  })

  const req: Record<string, any> = {
    user: {
      id: 'user_collaborator'
    },
    query: {
      formId: 'form_1'
    },
    params: {}
  }

  const allowed = await guard.canActivate(createHttpExecutionContext({ handler, req }))

  assert.strictEqual(allowed, true)
  assert.strictEqual(req.form.id, 'form_1')
  assert.strictEqual(req.project.id, 'project_1')
  assert.strictEqual(req.team.id, 'team_1')
}

async function testSignedOutRequestIsRejectedBeforeAnythingIsLoaded() {
  const handler = () => {}
  Reflect.defineMetadata('scope', PermissionScopeEnum.form, handler)

  const loaded: string[] = []
  const load = (name: string) => async () => {
    loaded.push(name)
    return null
  }
  const guard = new PermissionGuard(
    new Reflector(),
    { findById: load('team'), findMemberById: load('team member') } as any,
    { findById: load('project'), findMemberById: load('project member') } as any,
    { findById: load('form') } as any
  )

  for (const user of [undefined, null, {}]) {
    await assert.rejects(
      guard.canActivate(
        createGraphqlExecutionContext({ handler, req: { user }, input: { formId: 'form_1' } })
      ),
      (error: any) => error?.getStatus?.() === 401
    )
  }
  assert.deepStrictEqual(loaded, [])
}

async function testOwnerIsRecognisedAndSeenInTheWorkspace() {
  const handler = () => {}
  Reflect.defineMetadata('scope', PermissionScopeEnum.team, handler)

  const seen: any[] = []
  const guard = new PermissionGuard(
    new Reflector(),
    {
      findById: async () => ({
        id: 'team_1',
        ownerId: 'owner_1',
        name: 'Workspace A',
        storageQuota: 5,
        inviteCode: 'invite_1'
      }),
      findMemberById: async () => ({ role: 1 }),
      updateMember: async (...args: any[]) => {
        seen.push(args)
        return true
      }
    } as any,
    {} as any,
    {} as any
  )
  const req: Record<string, any> = { user: { id: 'owner_1' } }

  await guard.canActivate(
    createGraphqlExecutionContext({ handler, req, input: { teamId: 'team_1' } })
  )

  assert.deepStrictEqual(req.team, {
    id: 'team_1',
    ownerId: 'owner_1',
    isOwner: true,
    name: 'Workspace A',
    role: 1,
    storageQuota: 5,
    inviteCode: 'invite_1'
  })
  assert.strictEqual(seen.length, 1)
  assert.deepStrictEqual(seen[0].slice(0, 2), ['team_1', 'owner_1'])
  assert.ok(seen[0][2].lastSeenAt > 0)
}

async function run() {
  await testSignedOutRequestIsRejectedBeforeAnythingIsLoaded()
  await testOwnerIsRecognisedAndSeenInTheWorkspace()
  await testCollaboratorCanPassTeamGuard()
  await testNonMemberIsRejected()
  await testHttpFormGuardReadsRequestQuery()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
