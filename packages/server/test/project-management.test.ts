import { FormStatusEnum } from '@heyform-inc/shared-types-enums'
import assert from 'assert'

import { TeamRoleEnum } from '../src/model'
import { AddProjectMemberResolver } from '../src/resolver/project/add-project-member.resolver'
import { CreateProjectResolver } from '../src/resolver/project/create-project.resolver'
import { DeleteProjectMemberResolver } from '../src/resolver/project/delete-project-member.resolver'
import { EmptyProjectTrashResolver } from '../src/resolver/project/empty-project-trash.resolver'
import { LeaveProjectResolver } from '../src/resolver/project/leave-project.resolver'
import { ProjectMembersResolver } from '../src/resolver/project/project-members.resolver'
import { ProjectsResolver } from '../src/resolver/project/projects.resolver'
import { RenameProjectResolver } from '../src/resolver/project/rename-project.resolver'

import { createWorkspaceStore } from './helpers/workspace'

// A workspace owned by Olivia. Carl and Dana are collaborators; only Carl is in the first project.
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

async function testNewProjectIncludesItsCreatorAndTheWorkspaceOwner() {
  const { store, owner, collaborator, bystander, teamId } = await setup()
  const resolver = new CreateProjectResolver(store.projectService as any, store.teamService as any)

  const projectId = await resolver.createProject(
    collaborator as any,
    (await store.inTeam(collaborator, teamId)).team,
    { teamId, name: 'Launch', memberIds: [bystander.id] }
  )
  const project = store.projects.find(row => row.id === projectId)

  assert.strictEqual(project.teamId, teamId)
  assert.strictEqual(project.name, 'Launch')
  assert.strictEqual(project.ownerId, collaborator.id)
  // The owner of the workspace is in every project, whoever creates it
  assert.deepStrictEqual(store.projectMemberIds(projectId), [
    owner.id,
    collaborator.id,
    bystander.id
  ])

  const access = await store.inProject(collaborator, projectId)

  assert.strictEqual(access.project.isOwner, true)
  assert.strictEqual(access.team.isOwner, false)
  assert.strictEqual((await store.inProject(owner, projectId)).project.isOwner, false)
}

async function testNewProjectNamesNobodyTwice() {
  const { store, owner, collaborator, teamId } = await setup()
  const resolver = new CreateProjectResolver(store.projectService as any, store.teamService as any)
  const { team } = await store.inTeam(owner, teamId)

  // The membership pair is unique in the database, so a repeated id would fail the whole insert
  const projectId = await resolver.createProject(owner as any, team, {
    teamId,
    name: 'Launch',
    memberIds: [owner.id, collaborator.id, collaborator.id]
  })

  assert.deepStrictEqual(store.projectMemberIds(projectId), [owner.id, collaborator.id])

  const aloneId = await resolver.createProject(owner as any, team, { teamId, name: 'Alone' })

  assert.deepStrictEqual(store.projectMemberIds(aloneId), [owner.id])
}

// addProjectMember refuses anyone outside the workspace, and creating a project must not be a
// way around it: projectMembers would hand that person's name and email to the project.
async function testNewProjectOnlyTakesWorkspaceMembers() {
  const { store, owner, collaborator, bystander, outsider, teamId } = await setup()
  const resolver = new CreateProjectResolver(store.projectService as any, store.teamService as any)

  const projectId = await resolver.createProject(
    collaborator as any,
    (await store.inTeam(collaborator, teamId)).team,
    { teamId, name: 'Launch', memberIds: [outsider.id, bystander.id, 'missing'] }
  )

  assert.deepStrictEqual(store.projectMemberIds(projectId), [
    owner.id,
    collaborator.id,
    bystander.id
  ])

  const members = await new ProjectMembersResolver(
    store.projectService as any,
    store.userService as any
  ).projectMembers((await store.inProject(collaborator, projectId)).project, { projectId })

  assert.strictEqual(
    members.some(member => member.id === outsider.id),
    false
  )
}

async function testProjectListStaysInsideTheWorkspaceAndTheMembership() {
  const { store, owner, collaborator, bystander, outsider, teamId, projectId } = await setup()
  const privateProjectId = await store.addProject(teamId, owner, 'Private')
  const other = await store.addTeam(outsider, 'Other')
  const resolver = new ProjectsResolver(store.projectService as any)

  // Carl is also in a project of another workspace
  await store.addTeamMember(other.teamId, collaborator)
  await store.projectService.createMember({ projectId: other.projectId, memberId: collaborator.id })

  const ids = async (user: Record<string, any>, id: string) =>
    (await resolver.projects(user as any, { teamId: id })).map(project => project.id)

  assert.deepStrictEqual(await ids(collaborator, teamId), [projectId])
  assert.deepStrictEqual(await ids(collaborator, other.teamId), [other.projectId])
  assert.deepStrictEqual(await ids(owner, teamId), [privateProjectId, projectId])
  assert.deepStrictEqual(await ids(bystander, teamId), [])
}

async function testProjectIsOutOfReachWithoutBothMemberships() {
  const { store, owner, collaborator, bystander, outsider, teamId, projectId } = await setup()

  // In the workspace, not in the project
  await assert.rejects(store.inProject(bystander, projectId), /permission to access/)
  // In neither
  await assert.rejects(store.inProject(outsider, projectId), /permission to access/)
  await assert.rejects(store.inProject(owner, 'missing'), /permission to access this project/)

  // Still named by the project, no longer in the workspace
  await store.teamService.deleteMember(teamId, collaborator.id)
  assert.ok(store.projectMemberIds(projectId).includes(collaborator.id))
  await assert.rejects(
    store.inProject(collaborator, projectId),
    /permission to access the workspace/
  )
}

// The workspace is the one the project belongs to. Naming one's own workspace next to somebody
// else's project gets nowhere.
async function testWorkspaceInTheRequestDoesNotOpenAnotherWorkspacesProject() {
  const { store, owner, outsider, teamId, projectId } = await setup()
  const other = await store.addTeam(outsider, 'Other')

  await assert.rejects(
    store.inProject(outsider, projectId, { teamId: other.teamId }),
    /permission to access/
  )

  // For a member of the project the claim is ignored, not followed
  const access = await store.inProject(owner, projectId, { teamId: other.teamId })

  assert.strictEqual(access.team.id, teamId)
  assert.strictEqual(access.team.isOwner, true)
}

async function testAnyProjectMemberRenamesTheProject() {
  const { store, collaborator, teamId, projectId } = await setup()
  const otherProjectId = await store.addProject(teamId, collaborator, 'Other')
  const resolver = new RenameProjectResolver(store.projectService as any)

  assert.strictEqual(
    await resolver.renameProject((await store.inProject(collaborator, projectId)).team, {
      projectId,
      name: 'Renamed'
    }),
    true
  )
  assert.strictEqual(store.projects.find(row => row.id === projectId).name, 'Renamed')
  assert.strictEqual(store.projects.find(row => row.id === otherProjectId).name, 'Other')
}

async function testLeavingAProjectOnlyRemovesTheCaller() {
  const { store, owner, collaborator, teamId, projectId } = await setup()
  const otherProjectId = await store.addProject(teamId, owner, 'Other', [collaborator])
  const resolver = new LeaveProjectResolver(store.projectService as any)

  await store.inProject(collaborator, projectId)
  assert.strictEqual(await resolver.leaveProject(collaborator as any, { projectId }), true)

  assert.deepStrictEqual(store.projectMemberIds(projectId), [owner.id])
  assert.deepStrictEqual(store.projectMemberIds(otherProjectId), [owner.id, collaborator.id])
  // Out of the project, still in the workspace
  assert.ok(store.teamMemberIds(teamId).includes(collaborator.id))
  await assert.rejects(store.inProject(collaborator, projectId), /permission to access/)
  await store.inTeam(collaborator, teamId)
}

async function testAddedMemberReachesTheProject() {
  const { store, owner, collaborator, bystander, outsider, teamId, projectId } = await setup()
  const resolver = new AddProjectMemberResolver(
    store.projectService as any,
    store.teamService as any
  )
  const asOwner = await store.inProject(owner, projectId)

  await assert.rejects(store.inProject(bystander, projectId))
  assert.strictEqual(
    await resolver.addProjectMember(asOwner.team, asOwner.project, {
      projectId,
      memberId: bystander.id
    }),
    true
  )
  await store.inProject(bystander, projectId)

  await assert.rejects(
    resolver.addProjectMember(asOwner.team, asOwner.project, { projectId, memberId: bystander.id }),
    /already exists in this project/
  )
  await assert.rejects(
    resolver.addProjectMember(asOwner.team, asOwner.project, { projectId, memberId: outsider.id }),
    /does not belong to this workspace/
  )

  // A collaborator who did not create the project manages nobody
  const asCollaborator = await store.inProject(collaborator, projectId)

  await store.teamService.deleteMember(teamId, bystander.id)
  await store.projectService.deleteMember(projectId, bystander.id)
  await store.addTeamMember(teamId, bystander)
  await assert.rejects(
    resolver.addProjectMember(asCollaborator.team, asCollaborator.project, {
      projectId,
      memberId: bystander.id
    }),
    /permission to manage project members/
  )
  assert.deepStrictEqual(store.projectMemberIds(projectId), [owner.id, collaborator.id])
}

async function testProjectCreatorAndAdminsManageItsMembers() {
  const { store, owner, collaborator, bystander, teamId } = await setup()
  const admin = store.addUser('Ada')

  await store.addTeamMember(teamId, admin, TeamRoleEnum.ADMIN)

  // Carl's project: he manages it as its creator, Ada as an admin of the workspace
  const projectId = await store.addProject(teamId, collaborator, 'Carl’s', [owner, admin])
  const add = new AddProjectMemberResolver(store.projectService as any, store.teamService as any)
  const remove = new DeleteProjectMemberResolver(store.projectService as any)
  const asCreator = await store.inProject(collaborator, projectId)
  const asAdmin = await store.inProject(admin, projectId)

  await add.addProjectMember(asCreator.team, asCreator.project, {
    projectId,
    memberId: bystander.id
  })
  assert.ok(store.projectMemberIds(projectId).includes(bystander.id))

  await remove.deleteProjectMember(asAdmin.team, asAdmin.project, {
    projectId,
    memberId: bystander.id
  })
  assert.strictEqual(store.projectMemberIds(projectId).includes(bystander.id), false)

  // Neither the owner of the workspace nor the creator of the project can be taken out of it
  for (const memberId of [owner.id, collaborator.id]) {
    await assert.rejects(
      remove.deleteProjectMember(asAdmin.team, asAdmin.project, { projectId, memberId }),
      /permission to remove member/
    )
  }
  assert.deepStrictEqual(store.projectMemberIds(projectId), [collaborator.id, owner.id, admin.id])
}

async function testEmptyingTheTrashKeepsLiveFormsAndOtherProjects() {
  const { store, owner, teamId, projectId } = await setup()
  const otherProjectId = await store.addProject(teamId, owner, 'Other')
  const trashed = await store.addForm({ teamId, projectId, status: FormStatusEnum.TRASH })
  const live = await store.addForm({ teamId, projectId })
  const trashedElsewhere = await store.addForm({
    teamId,
    projectId: otherProjectId,
    status: FormStatusEnum.TRASH
  })

  for (const formId of [trashed, live, trashedElsewhere]) {
    store.addSubmission(formId)
    store.addSubmission(formId)
  }

  const resolver = new EmptyProjectTrashResolver(
    store.formService as any,
    store.submissionService as any
  )

  await store.inProject(owner, projectId)
  assert.strictEqual(await resolver.emptyProjectTrash({ projectId }), true)

  assert.deepStrictEqual(
    store.forms.map(form => form.id),
    [live, trashedElsewhere]
  )
  assert.deepStrictEqual(
    store.submissions.map(row => row.formId),
    [live, live, trashedElsewhere, trashedElsewhere]
  )

  // Nothing left in the trash: nothing more to delete
  assert.strictEqual(await resolver.emptyProjectTrash({ projectId }), true)
  assert.strictEqual(store.forms.length, 2)
  assert.strictEqual(store.submissions.length, 4)
}

async function run() {
  await testNewProjectIncludesItsCreatorAndTheWorkspaceOwner()
  await testNewProjectNamesNobodyTwice()
  await testNewProjectOnlyTakesWorkspaceMembers()
  await testProjectListStaysInsideTheWorkspaceAndTheMembership()
  await testProjectIsOutOfReachWithoutBothMemberships()
  await testWorkspaceInTheRequestDoesNotOpenAnotherWorkspacesProject()
  await testAnyProjectMemberRenamesTheProject()
  await testLeavingAProjectOnlyRemovesTheCaller()
  await testAddedMemberReachesTheProject()
  await testProjectCreatorAndAdminsManageItsMembers()
  await testEmptyingTheTrashKeepsLiveFormsAndOtherProjects()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
