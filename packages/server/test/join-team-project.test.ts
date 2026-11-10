import { BadRequestException } from '@nestjs/common'
import assert from 'assert'

import { TeamRoleEnum } from '../src/model'
import { JoinTeamResolver } from '../src/resolver/team/join-team.resolver'
import { ProjectService } from '../src/service/project.service'

const user = { id: 'user_1', name: 'Joiner', email: 'joiner@example.com' }
const team = { id: 'team_1', name: 'Workspace', ownerId: 'owner_1' }
const project = { id: 'project_1', teamId: team.id }

interface Options {
  team?: Record<string, any> | null
  project?: Record<string, any> | null
  alreadyJoined?: boolean
  alreadyInProject?: boolean
  invite?: Record<string, any> | null
}

function setup({
  team: teamOverride = team,
  project: projectOverride = project,
  alreadyJoined = false,
  alreadyInProject = false,
  invite = team
}: Options = {}) {
  const teamMembers: Record<string, any>[] = []
  const projectMembers: Record<string, any>[] = []

  const resolver = new JoinTeamResolver(
    {
      findById: async () => teamOverride,
      findJoinableByInvite: async () => invite,
      findMemberById: async () => (alreadyJoined ? { memberId: user.id } : null),
      createMember: async (member: Record<string, any>) => {
        teamMembers.push(member)
        return 'team_member_1'
      }
    } as any,
    { findById: async () => ({ email: 'owner@example.com' }) } as any,
    { joinWorkspaceAlert: () => undefined } as any,
    {
      addMemberToDefaultProject: ProjectService.prototype.addMemberToDefaultProject,
      findDefaultInTeam: async () => projectOverride,
      findMemberById: async () => (alreadyInProject ? { memberId: user.id } : null),
      createMember: async (member: Record<string, any>) => {
        projectMembers.push(member)
        return true
      }
    } as any
  )

  return {
    teamMembers,
    projectMembers,
    join: (input: Record<string, any> = { teamId: team.id, inviteCode: 'code_1' }) =>
      resolver.joinTeam(user as any, input as any)
  }
}

async function testJoinerStartsInTheDefaultProject() {
  const { teamMembers, projectMembers, join } = setup()

  assert.strictEqual(await join(), true)
  assert.deepStrictEqual(teamMembers, [
    { teamId: team.id, memberId: user.id, role: TeamRoleEnum.COLLABORATOR }
  ])
  assert.deepStrictEqual(projectMembers, [{ projectId: project.id, memberId: user.id }])
}

async function testWorkspaceWithoutAProjectStillAcceptsTheJoiner() {
  const { teamMembers, projectMembers, join } = setup({ project: null })

  assert.strictEqual(await join(), true)
  assert.strictEqual(teamMembers.length, 1)
  assert.deepStrictEqual(projectMembers, [])
}

// A project can name a member before they join the workspace, and the pair is unique in the database
async function testJoinerAlreadyInTheProjectIsNotAddedTwice() {
  const { teamMembers, projectMembers, join } = setup({ alreadyInProject: true })

  assert.strictEqual(await join(), true)
  assert.strictEqual(teamMembers.length, 1)
  assert.deepStrictEqual(projectMembers, [])
}

async function testWrongInviteCodeAddsNothing() {
  const { teamMembers, projectMembers, join } = setup({ invite: null })

  await assert.rejects(join({ teamId: team.id, inviteCode: 'wrong' }), BadRequestException)
  assert.deepStrictEqual(teamMembers, [])
  assert.deepStrictEqual(projectMembers, [])
}

async function testExistingMemberIsNotJoinedAgain() {
  const { teamMembers, projectMembers, join } = setup({ alreadyJoined: true })

  await assert.rejects(join(), /You've already joined the workspace/)
  assert.deepStrictEqual(teamMembers, [])
  assert.deepStrictEqual(projectMembers, [])
}

async function run() {
  await testJoinerStartsInTheDefaultProject()
  await testWorkspaceWithoutAProjectStillAcceptsTheJoiner()
  await testJoinerAlreadyInTheProjectIsNotAddedTwice()
  await testWrongInviteCodeAddsNothing()
  await testExistingMemberIsNotJoinedAgain()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
