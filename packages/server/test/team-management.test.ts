import assert from 'assert'

import { TeamRoleEnum } from '../src/model'
import { CreateBrandKitResolver } from '../src/resolver/team/create-brand-kit.resolver'
import { CreateTeamResolver } from '../src/resolver/team/create-team.resolver'
import { InviteMemberResolver } from '../src/resolver/team/invite-member.resolver'
import { LeaveTeamResolver } from '../src/resolver/team/leave-team.resolver'
import { PublicTeamDetailResolver } from '../src/resolver/team/public-team-detail.resolver'
import { RemoveTeamMemberResolver } from '../src/resolver/team/remove-team-member.resolver'
import { ResetTeamInviteCodeResolver } from '../src/resolver/team/reset-team-invite-code.resolver'
import { TeamMembersResolver } from '../src/resolver/team/team-members.resolver'
import { TeamOverviewResolver } from '../src/resolver/team/team-overview.resolver'
import { TeamsResolver } from '../src/resolver/team/teams.resolver'
import { TransferTeamResolver } from '../src/resolver/team/transfer-team.resolver'
import { UpdateTeamResolver } from '../src/resolver/team/update-team.resolver'

import { WorkspaceStore, createWorkspaceStore } from './helpers/workspace'

// A workspace owned by Olivia. Carl is a collaborator in the first project; Dana is a
// collaborator in no project.
async function setup() {
  const store = createWorkspaceStore()
  const owner = store.addUser('Olivia')
  const collaborator = store.addUser('Carl')
  const bystander = store.addUser('Dana')
  const outsider = store.addUser('Otto')
  const { teamId, projectId } = await store.addTeam(owner, 'Acme')

  await store.addTeamMember(teamId, collaborator)
  await store.addTeamMember(teamId, bystander)
  await store.projectService.createMember({ projectId, memberId: collaborator.id })

  return { store, owner, collaborator, bystander, outsider, teamId, projectId }
}

// Everything a failed request must leave alone. Passing the guard records when the member was
// last seen, which is not a change the request made.
function snapshot(store: WorkspaceStore) {
  return JSON.stringify([
    store.teams,
    store.teamMembers.map(({ lastSeenAt, ...member }) => member),
    store.projects,
    store.projectMembers
  ])
}

async function testNewWorkspaceStartsWithItsOwnerAndAProject() {
  const store = createWorkspaceStore()
  const user = store.addUser('Olivia')
  const resolver = new CreateTeamResolver(store.teamService as any, store.projectService as any)

  const teamId = await resolver.createTeam(user as any, { name: 'Acme', projectName: 'Launch' })

  assert.strictEqual(store.teams.length, 1)
  assert.strictEqual(store.teams[0].ownerId, user.id)
  assert.strictEqual(store.teams[0].name, 'Acme')
  assert.deepStrictEqual(store.teamMembers, [
    { lastSeenAt: 0, teamId, memberId: user.id, role: TeamRoleEnum.ADMIN }
  ])

  assert.strictEqual(store.projects.length, 1)
  assert.strictEqual(store.projects[0].teamId, teamId)
  assert.strictEqual(store.projects[0].name, 'Launch')
  assert.strictEqual(store.projects[0].ownerId, user.id)
  assert.deepStrictEqual(store.projectMemberIds(store.projects[0].id), [user.id])

  // The creator can reach both through the guard straight away
  const { team } = await store.inProject(user, store.projects[0].id)

  assert.strictEqual(team.isOwner, true)
}

async function testOnlyTheOwnerChangesWorkspaceSettings() {
  const { store, owner, collaborator, teamId } = await setup()
  const resolver = new UpdateTeamResolver(store.teamService as any)
  const before = snapshot(store)

  await assert.rejects(
    resolver.updateTeam((await store.inTeam(collaborator, teamId)).team, {
      teamId,
      name: 'Hijacked'
    }),
    /permission to change the workspace settings/
  )
  assert.strictEqual(snapshot(store), before)

  const { team } = await store.inTeam(owner, teamId)

  await resolver.updateTeam(team, { teamId, name: 'Acme Inc.' })
  assert.strictEqual(store.teams[0].name, 'Acme Inc.')
  assert.strictEqual(store.teams[0].ownerId, owner.id)
}

async function testWorkspaceUpdateKeepsWhatWasNotSent() {
  const { store, owner, teamId } = await setup()
  const resolver = new UpdateTeamResolver(store.teamService as any)
  const { team } = await store.inTeam(owner, teamId)

  await resolver.updateTeam(team, { teamId, avatar: 'https://example.com/a.png' })
  assert.strictEqual(store.teams[0].name, 'Acme')
  assert.strictEqual(store.teams[0].avatar, 'https://example.com/a.png')
  assert.strictEqual('removeBranding' in store.teams[0], false)

  await resolver.updateTeam(team, { teamId, removeBranding: true })
  assert.strictEqual(store.teams[0].removeBranding, true)

  // Turning the branding back on is a `false`, which must not be dropped as an empty value
  await resolver.updateTeam(team, { teamId, removeBranding: false })
  assert.strictEqual(store.teams[0].removeBranding, false)
  assert.strictEqual(store.teams[0].avatar, 'https://example.com/a.png')
}

async function testOnlyTheOwnerResetsTheInviteCode() {
  const { store, owner, collaborator, outsider, teamId } = await setup()
  const resolver = new ResetTeamInviteCodeResolver(store.teamService as any)
  const oldCode = store.teams[0].inviteCode

  await assert.rejects(
    resolver.resetTeamInviteCode((await store.inTeam(collaborator, teamId)).team, { teamId }),
    /permission to reset workspace invite code/
  )
  assert.strictEqual(store.teams[0].inviteCode, oldCode)

  await resolver.resetTeamInviteCode((await store.inTeam(owner, teamId)).team, { teamId })

  const newCode = store.teams[0].inviteCode

  assert.notStrictEqual(newCode, oldCode)
  assert.ok(store.teams[0].inviteCodeExpireAt > Date.now() / 1000)

  // The link that was shared before the reset stops working
  assert.strictEqual(await store.teamService.findJoinableByInvite(teamId, oldCode), null)
  assert.ok(await store.teamService.findJoinableByInvite(teamId, newCode))
  assert.deepStrictEqual(store.teamMemberIds(teamId).includes(outsider.id), false)
}

async function testOwnershipMovesToAnotherMember() {
  const { store, owner, collaborator, bystander, teamId, projectId } = await setup()
  const privateProjectId = await store.addProject(teamId, owner, 'Private')
  const resolver = new TransferTeamResolver(store.teamService as any, store.projectService as any)

  // Bystander belongs to none of the two projects
  await resolver.transferTeam((await store.inTeam(owner, teamId)).team, {
    teamId,
    memberId: bystander.id
  })

  assert.strictEqual(store.teams[0].ownerId, bystander.id)
  assert.strictEqual(
    (await store.teamService.findMemberById(teamId, bystander.id)).role,
    TeamRoleEnum.ADMIN
  )

  // The new owner can reach every project of the workspace
  assert.ok(store.projectMemberIds(projectId).includes(bystander.id))
  assert.ok(store.projectMemberIds(privateProjectId).includes(bystander.id))
  assert.strictEqual((await store.inProject(bystander, privateProjectId)).team.isOwner, true)

  // The previous owner stays in the workspace, without the owner's rights
  assert.ok(store.teamMemberIds(teamId).includes(owner.id))
  assert.strictEqual((await store.inTeam(owner, teamId)).team.isOwner, false)
  await assert.rejects(
    resolver.transferTeam((await store.inTeam(owner, teamId)).team, {
      teamId,
      memberId: collaborator.id
    }),
    /permission to transfer workspace/
  )
}

async function testOwnershipTransferSkipsProjectsAlreadyJoined() {
  const { store, owner, collaborator, teamId, projectId } = await setup()
  const privateProjectId = await store.addProject(teamId, owner, 'Private')
  const resolver = new TransferTeamResolver(store.teamService as any, store.projectService as any)

  // Carl is already in the first project: adding him twice would break the unique index
  await resolver.transferTeam((await store.inTeam(owner, teamId)).team, {
    teamId,
    memberId: collaborator.id
  })

  assert.deepStrictEqual(store.projectMemberIds(projectId), [owner.id, collaborator.id])
  assert.deepStrictEqual(store.projectMemberIds(privateProjectId), [owner.id, collaborator.id])
}

async function testOwnershipOnlyMovesFromTheOwnerToAMember() {
  const { store, owner, collaborator, outsider, teamId } = await setup()
  const resolver = new TransferTeamResolver(store.teamService as any, store.projectService as any)
  const stranger = store.addUser('Sam')

  // Otto owns another workspace, which makes him no member of this one
  await store.addTeam(outsider, 'Other')

  const before = snapshot(store)

  await assert.rejects(
    resolver.transferTeam((await store.inTeam(collaborator, teamId)).team, {
      teamId,
      memberId: collaborator.id
    }),
    /permission to transfer workspace/
  )

  for (const memberId of [outsider.id, stranger.id, 'missing']) {
    await assert.rejects(
      resolver.transferTeam((await store.inTeam(owner, teamId)).team, { teamId, memberId }),
      /workspace member does not exist/
    )
  }

  assert.strictEqual(snapshot(store), before)
}

async function testRemovedMemberLosesTheWorkspaceAndItsProjects() {
  const { store, owner, collaborator, bystander, teamId, projectId } = await setup()
  const secondProjectId = await store.addProject(teamId, owner, 'Second', [collaborator])
  // Carl also owns a workspace of his own, which removing him here must not touch
  const own = await store.addTeam(collaborator, 'Carl’s')
  const resolver = new RemoveTeamMemberResolver(
    store.teamService as any,
    store.projectService as any
  )

  assert.strictEqual(
    await resolver.removeTeamMember((await store.inTeam(owner, teamId)).team, {
      teamId,
      memberId: collaborator.id
    }),
    true
  )

  assert.deepStrictEqual(store.teamMemberIds(teamId), [owner.id, bystander.id])
  assert.deepStrictEqual(store.projectMemberIds(projectId), [owner.id])
  assert.deepStrictEqual(store.projectMemberIds(secondProjectId), [owner.id])
  await assert.rejects(store.inTeam(collaborator, teamId), /permission to access the workspace/)
  await assert.rejects(store.inProject(collaborator, projectId), /permission to access/)

  assert.deepStrictEqual(store.teamMemberIds(own.teamId), [collaborator.id])
  assert.deepStrictEqual(store.projectMemberIds(own.projectId), [collaborator.id])
}

async function testOnlyTheOwnerRemovesMembersAndNeverThemself() {
  const { store, owner, collaborator, bystander, outsider, teamId } = await setup()
  const resolver = new RemoveTeamMemberResolver(
    store.teamService as any,
    store.projectService as any
  )
  const before = snapshot(store)

  await assert.rejects(
    resolver.removeTeamMember((await store.inTeam(collaborator, teamId)).team, {
      teamId,
      memberId: bystander.id
    }),
    /not allowed in the workspace/
  )
  await assert.rejects(
    resolver.removeTeamMember((await store.inTeam(owner, teamId)).team, {
      teamId,
      memberId: outsider.id
    }),
    /member in the workspace does not exist/
  )
  // A workspace without its owner could no longer be managed by anyone
  await assert.rejects(
    resolver.removeTeamMember((await store.inTeam(owner, teamId)).team, {
      teamId,
      memberId: owner.id
    }),
    /not allowed in the workspace/
  )

  assert.strictEqual(snapshot(store), before)
}

async function testMemberLeavesTheWorkspaceAndItsProjects() {
  const { store, owner, collaborator, bystander, teamId, projectId } = await setup()
  const resolver = new LeaveTeamResolver(store.teamService as any, store.projectService as any)

  assert.strictEqual(
    await resolver.leaveTeam(collaborator as any, (await store.inTeam(collaborator, teamId)).team, {
      teamId
    }),
    true
  )

  assert.deepStrictEqual(store.teamMemberIds(teamId), [owner.id, bystander.id])
  assert.deepStrictEqual(store.projectMemberIds(projectId), [owner.id])
  await assert.rejects(store.inTeam(collaborator, teamId), /permission to access the workspace/)
}

async function testOwnerCannotLeaveTheWorkspace() {
  const { store, owner, teamId } = await setup()
  const resolver = new LeaveTeamResolver(store.teamService as any, store.projectService as any)
  const before = snapshot(store)

  await assert.rejects(
    resolver.leaveTeam(owner as any, (await store.inTeam(owner, teamId)).team, { teamId }),
    /not allowed in the workspace/
  )
  assert.strictEqual(snapshot(store), before)
}

function inviteSetup(store: WorkspaceStore, throttle?: (key: string) => void) {
  const sent: Record<string, any>[] = []
  const throttled: Record<string, any>[] = []
  const resolver = new InviteMemberResolver(
    store.userService as any,
    store.teamService as any,
    {
      teamInvitation: async (email: string, options: Record<string, any>, lang: string) => {
        sent.push({ email, ...options, lang })
      }
    } as any,
    {
      throttler: async (key: string, limit: number, ttl: string, amount: number) => {
        throttled.push({ key, limit, ttl, amount })
        throttle?.(key)
      }
    } as any
  )

  return { resolver, sent, throttled }
}

async function testInvitationGoesToEveryNewAddressOnce() {
  const { store, owner, teamId } = await setup()
  const { resolver, sent, throttled } = inviteSetup(store)
  const { team } = await store.inTeam(owner, teamId)

  assert.strictEqual(
    await resolver.inviteMember(team, owner as any, {
      teamId,
      // Carl is a member already, under any spelling of his address
      emails: ['New@Example.com', ' new@example.com ', 'CARL@example.com', 'second@example.com']
    }),
    true
  )

  assert.deepStrictEqual(
    sent.map(row => row.email),
    ['new@example.com', 'second@example.com']
  )
  assert.strictEqual(sent[0].userName, 'Olivia')
  assert.strictEqual(sent[0].teamName, 'Acme')
  assert.strictEqual(sent[0].lang, 'en')
  assert.ok(sent[0].link.endsWith(`/workspace/${teamId}/invitation/${team.inviteCode}`))
  assert.strictEqual(team.inviteCode, store.teams[0].inviteCode)

  // The hourly budget counts recipients, for the sender and for the workspace
  assert.deepStrictEqual(throttled, [
    { key: `invite-member:user:${owner.id}`, limit: 100, ttl: '1h', amount: 2 },
    { key: `invite-member:team:${teamId}`, limit: 100, ttl: '1h', amount: 2 }
  ])
  // An invitation is a link: nobody joins until they follow it
  assert.strictEqual(store.teamMemberIds(teamId).length, 3)
}

async function testInvitingOnlyMembersSendsNothing() {
  const { store, owner, teamId } = await setup()
  const { resolver, sent, throttled } = inviteSetup(store)

  assert.strictEqual(
    await resolver.inviteMember((await store.inTeam(owner, teamId)).team, owner as any, {
      teamId,
      emails: ['carl@example.com', 'Olivia@example.com']
    }),
    true
  )
  assert.deepStrictEqual(sent, [])
  assert.deepStrictEqual(throttled, [])
}

async function testOnlyTheOwnerInvites() {
  const { store, collaborator, teamId } = await setup()
  const { resolver, sent, throttled } = inviteSetup(store)

  await assert.rejects(
    resolver.inviteMember((await store.inTeam(collaborator, teamId)).team, collaborator as any, {
      teamId,
      emails: ['new@example.com']
    }),
    /permission to invite member/
  )
  assert.deepStrictEqual(sent, [])
  assert.deepStrictEqual(throttled, [])
}

async function testInvitationOverTheBudgetSendsNothing() {
  const { store, owner, teamId } = await setup()

  for (const blocked of ['user', 'team']) {
    const { resolver, sent } = inviteSetup(store, key => {
      if (key.startsWith(`invite-member:${blocked}:`)) {
        throw new Error('Too many requests')
      }
    })

    await assert.rejects(
      resolver.inviteMember((await store.inTeam(owner, teamId)).team, owner as any, {
        teamId,
        emails: ['new@example.com']
      }),
      /Too many requests/
    )
    assert.deepStrictEqual(sent, [], `${blocked} budget`)
  }
}

async function testInvitationPageOnlyOffersAValidLink() {
  const { store, owner, teamId } = await setup()
  const resolver = new PublicTeamDetailResolver(store.teamService as any, store.userService as any)
  const inviteCode = store.teams[0].inviteCode

  const detail = await resolver.publicTeamDetail({ teamId, inviteCode })

  assert.strictEqual(detail.id, teamId)
  assert.strictEqual(detail.name, 'Acme')
  assert.strictEqual(detail.memberCount, 3)
  assert.strictEqual(detail.owner.name, owner.name)
  assert.strictEqual(detail.allowJoinByInviteLink, true)
  // The page must not hand out what joining needs
  assert.strictEqual('inviteCode' in detail, false)

  assert.strictEqual(
    (await resolver.publicTeamDetail({ teamId, inviteCode: 'wrong' })).allowJoinByInviteLink,
    false
  )

  store.teams[0].inviteCodeExpireAt = Math.floor(Date.now() / 1000) - 1
  assert.strictEqual(
    (await resolver.publicTeamDetail({ teamId, inviteCode })).allowJoinByInviteLink,
    false
  )

  store.teams[0].inviteCodeExpireAt = Math.floor(Date.now() / 1000) + 3600
  store.teams[0].allowJoinByInviteLink = false
  assert.strictEqual(
    (await resolver.publicTeamDetail({ teamId, inviteCode })).allowJoinByInviteLink,
    false
  )

  await assert.rejects(
    resolver.publicTeamDetail({ teamId: 'missing', inviteCode }),
    /workspace does not exist/
  )
}

async function testMemberListCarriesRolesAndTheOwner() {
  const { store, owner, collaborator, bystander, teamId } = await setup()
  const resolver = new TeamMembersResolver(store.userService as any, store.teamService as any)

  await store.teamService.updateMember(teamId, bystander.id, { role: TeamRoleEnum.MEMBER })

  // Passing the guard is what records when a member was last seen
  const { team } = await store.inTeam(collaborator, teamId)
  const members: any[] = await resolver.teamMembers(collaborator as any, team, { teamId })
  const byId = (id: string) => members.find(row => row.id === id)

  assert.strictEqual(members.length, 3)
  assert.deepStrictEqual(
    [byId(owner.id).role, byId(collaborator.id).role, byId(bystander.id).role],
    [TeamRoleEnum.ADMIN, TeamRoleEnum.COLLABORATOR, TeamRoleEnum.MEMBER]
  )
  assert.deepStrictEqual(
    [byId(owner.id).isOwner, byId(collaborator.id).isOwner, byId(bystander.id).isOwner],
    [true, false, false]
  )
  assert.ok(byId(collaborator.id).lastSeenAt > 0)
  assert.strictEqual(byId(bystander.id).lastSeenAt, 0)
}

async function testWorkspaceListOnlyShowsWhatTheMemberBelongsTo() {
  const { store, owner, collaborator, bystander, outsider, teamId, projectId } = await setup()
  const privateProjectId = await store.addProject(teamId, owner, 'Private')
  const other = await store.addTeam(outsider, 'Zeta')

  await store.addTeamMember(other.teamId, collaborator)
  await store.addForm({ teamId, projectId })
  await store.addForm({ teamId, projectId })
  await store.addForm({ teamId, projectId: privateProjectId })

  const resolver = new TeamsResolver(
    store.teamService as any,
    store.formService as any,
    store.projectService as any,
    {
      findAllInTeams: async (teamIds: string[]) =>
        [{ id: 'kit_1', teamId }].filter(row => teamIds.includes(row.teamId))
    } as any
  )

  const teams = await resolver.teams(collaborator as any)

  assert.deepStrictEqual(
    teams.map(team => team.name),
    ['Acme', 'Zeta']
  )

  const [acme, zeta] = teams

  assert.strictEqual(acme.isOwner, false)
  assert.strictEqual(acme.memberCount, 3)
  // The project Carl is not in stays out of his list, with its forms
  assert.deepStrictEqual(
    acme.projects.map(project => project.id),
    [projectId]
  )
  assert.deepStrictEqual(acme.projects[0].members, [owner.id, collaborator.id])
  assert.strictEqual(acme.projects[0].formCount, 2)
  assert.deepStrictEqual(
    acme.brandKits.map(row => row.id),
    ['kit_1']
  )

  // A workspace joined without a project: listed, and empty
  assert.strictEqual(zeta.memberCount, 2)
  assert.deepStrictEqual(zeta.projects, [])
  assert.deepStrictEqual(zeta.brandKits, [])

  const owned = await resolver.teams(owner as any)

  assert.strictEqual(owned.length, 1)
  assert.strictEqual(owned[0].isOwner, true)
  // Newest project first
  assert.deepStrictEqual(
    owned[0].projects.map(project => project.id),
    [privateProjectId, projectId]
  )
  assert.strictEqual(owned[0].projects.find(row => row.id === privateProjectId).formCount, 1)

  // A member in no project, and a user in no workspace
  assert.deepStrictEqual((await resolver.teams(bystander as any))[0].projects, [])
  assert.deepStrictEqual(await resolver.teams(store.addUser('Nobody') as any), [])
}

async function testOverviewCountsTheWorkspace() {
  const { store, owner, outsider, teamId, projectId } = await setup()
  const formId = await store.addForm({ teamId, projectId })
  const other = await store.addTeam(outsider, 'Other')
  const otherFormId = await store.addForm({ teamId: other.teamId, projectId: other.projectId })

  store.addSubmission(formId)
  store.addSubmission(formId)
  store.addSubmission(otherFormId)
  store.teams[0].storageQuota = 1024

  const overview = await new TeamOverviewResolver(
    store.teamService as any,
    store.formService as any,
    store.submissionService as any
  ).teamOverview((await store.inTeam(owner, teamId)).team, { teamId })

  assert.deepStrictEqual(overview, {
    memberCount: 3,
    formCount: 1,
    submissionQuota: 2,
    storageQuota: 1024
  })
}

async function testWorkspaceHasOneBrandKit() {
  const { store, owner, teamId } = await setup()
  const kits: Record<string, any>[] = []
  const resolver = new CreateBrandKitResolver({
    findByTeamId: async (id: string) => kits.find(row => row.teamId === id) ?? null,
    create: async (kit: Record<string, any>) => {
      kits.push({ id: `kit_${kits.length + 1}`, ...kit })
      return kits[kits.length - 1].id
    }
  } as any)
  const { team } = await store.inTeam(owner, teamId)

  const first = await resolver.createBrandKit(team, {
    teamId,
    logo: 'https://example.com/logo.png',
    theme: { fontFamily: 'Inter' }
  })
  // Asking again returns the kit that exists, and leaves it as it is
  const second = await resolver.createBrandKit(team, {
    teamId,
    logo: 'https://example.com/other.png',
    theme: {}
  })

  assert.strictEqual(second, first)
  assert.deepStrictEqual(kits, [
    { id: first, teamId, logo: 'https://example.com/logo.png', theme: { fontFamily: 'Inter' } }
  ])
}

async function run() {
  await testNewWorkspaceStartsWithItsOwnerAndAProject()
  await testOnlyTheOwnerChangesWorkspaceSettings()
  await testWorkspaceUpdateKeepsWhatWasNotSent()
  await testOnlyTheOwnerResetsTheInviteCode()
  await testOwnershipMovesToAnotherMember()
  await testOwnershipTransferSkipsProjectsAlreadyJoined()
  await testOwnershipOnlyMovesFromTheOwnerToAMember()
  await testRemovedMemberLosesTheWorkspaceAndItsProjects()
  await testOnlyTheOwnerRemovesMembersAndNeverThemself()
  await testMemberLeavesTheWorkspaceAndItsProjects()
  await testOwnerCannotLeaveTheWorkspace()
  await testInvitationGoesToEveryNewAddressOnce()
  await testInvitingOnlyMembersSendsNothing()
  await testOnlyTheOwnerInvites()
  await testInvitationOverTheBudgetSendsNothing()
  await testInvitationPageOnlyOffersAValidLink()
  await testMemberListCarriesRolesAndTheOwner()
  await testWorkspaceListOnlyShowsWhatTheMemberBelongsTo()
  await testOverviewCountsTheWorkspace()
  await testWorkspaceHasOneBrandKit()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
