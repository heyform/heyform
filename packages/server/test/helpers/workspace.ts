import { FormStatusEnum } from '@heyform-inc/shared-types-enums'
import { Reflector } from '@nestjs/core'
import 'reflect-metadata'

import { PermissionGuard, PermissionScopeEnum } from '../../src/common/guard/permission.guard'
import { TeamRoleEnum } from '../../src/model'
import { ProjectService } from '../../src/service/project.service'
import { TeamService } from '../../src/service/team.service'

type Row = Record<string, any>

const FAR_FUTURE = 4102444800 // 2100-01-01, in seconds

// What a mongoose document gives the code under test: the fields, toObject() and get()
function toDocument<T extends Row>(row: T | undefined): any {
  if (!row) {
    return null
  }

  return {
    ...row,
    toObject: () => ({ ...row }),
    get: (key: string) => row[key]
  }
}

function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

// Applies a mongoose-style update, where a dotted key reaches into a nested object
function applyUpdates(row: Row, updates: Row) {
  for (const [key, value] of Object.entries(updates)) {
    const path = key.split('.')
    let target = row

    for (const part of path.slice(0, -1)) {
      target[part] = { ...target[part] }
      target = target[part]
    }

    target[path[path.length - 1]] = value
  }
}

function countBy(rows: Row[], key: string) {
  const counts = new Map<string, number>()

  for (const row of rows) {
    counts.set(row[key], (counts.get(row[key]) ?? 0) + 1)
  }

  return Array.from(counts, ([_id, count]) => ({ _id, count }))
}

/**
 * The workspace data and the services over it, held in memory. The services answer the way the
 * real ones do against MongoDB, including the unique membership indexes, so a resolver can run
 * behind the real PermissionGuard without a database.
 */
export function createWorkspaceStore() {
  const users: Row[] = []
  const teams: Row[] = []
  const teamMembers: Row[] = []
  const projects: Row[] = []
  const projectMembers: Row[] = []
  const forms: Row[] = []
  const submissions: Row[] = []
  let sequence = 0

  const nextId = (prefix: string) => `${prefix}_${++sequence}`

  const teamService = {
    resetInviteCode: TeamService.prototype.resetInviteCode,
    findById: async (id: string) => toDocument(teams.find(row => row.id === id)),
    findJoinableByInvite: async (teamId: string, inviteCode: string) =>
      toDocument(
        teams.find(
          row =>
            row.id === teamId &&
            row.inviteCode === inviteCode &&
            row.allowJoinByInviteLink &&
            row.inviteCodeExpireAt > Date.now() / 1000
        )
      ),
    findAll: async (memberId: string) =>
      teams
        .filter(team =>
          teamMembers.some(row => row.teamId === team.id && row.memberId === memberId)
        )
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(toDocument),
    create: async (team: Row) => {
      const id = nextId('team')
      teams.push({
        id,
        inviteCode: `invite_${id}`,
        inviteCodeExpireAt: FAR_FUTURE,
        allowJoinByInviteLink: true,
        ...team
      })
      return id
    },
    update: async (id: string, updates: Row) => {
      const team = teams.find(row => row.id === id)

      if (team) {
        applyUpdates(team, updates)
      }

      return true
    },
    delete: async (id: string) => {
      const index = teams.findIndex(row => row.id === id)

      if (index > -1) {
        teams.splice(index, 1)
      }

      return index > -1
    },
    findMemberById: async (teamId: string, memberId: string) =>
      teamMembers.find(row => row.teamId === teamId && row.memberId === memberId) ?? null,
    findMembersInTeam: async (teamId: string) => teamMembers.filter(row => row.teamId === teamId),
    memberCount: async (teamId: string) => teamMembers.filter(row => row.teamId === teamId).length,
    memberCountMaps: async (teamIds: string[]) =>
      countBy(
        teamMembers.filter(row => teamIds.includes(row.teamId)),
        'teamId'
      ),
    createMember: async (member: Row) => {
      if (
        teamMembers.some(row => row.teamId === member.teamId && row.memberId === member.memberId)
      ) {
        throw new Error('E11000 duplicate key: team member')
      }

      teamMembers.push({ lastSeenAt: 0, ...member })
      return nextId('team_member')
    },
    updateMember: async (teamId: string, memberId: string, updates: Row) => {
      const member = teamMembers.find(row => row.teamId === teamId && row.memberId === memberId)

      if (member) {
        applyUpdates(member, updates)
      }

      return true
    },
    deleteMember: async (teamId: string, memberId: string) => {
      const index = teamMembers.findIndex(row => row.teamId === teamId && row.memberId === memberId)

      if (index > -1) {
        teamMembers.splice(index, 1)
      }

      return index > -1
    }
  }

  const projectService = {
    createByNewTeam: ProjectService.prototype.createByNewTeam,
    addMemberToDefaultProject: ProjectService.prototype.addMemberToDefaultProject,
    // Newest first, as every listing in the real service sorts
    findAllInTeam: async (teamId: string) =>
      projects
        .filter(row => row.teamId === teamId)
        .reverse()
        .map(toDocument),
    findDefaultInTeam: async (teamId: string) =>
      toDocument(projects.find(row => row.teamId === teamId)),
    findOne: async (conditions: Row) =>
      toDocument(
        projects.find(row => row.id === conditions._id && row.teamId === conditions.teamId)
      ),
    findById: async (id: string) => toDocument(projects.find(row => row.id === id)),
    findByIds: async (ids: string[], conditions: Row = {}) =>
      projects
        .filter(
          row => ids.includes(row.id) && (!conditions.teamId || row.teamId === conditions.teamId)
        )
        .reverse()
        .map(toDocument),
    create: async (project: Row) => {
      const id = nextId('project')
      projects.push({ id, ...project })
      return id
    },
    update: async (id: string, updates: Row) => {
      const project = projects.find(row => row.id === id)

      if (project) {
        applyUpdates(project, updates)
      }

      return true
    },
    delete: async (id: string) => {
      const index = projects.findIndex(row => row.id === id)

      if (index > -1) {
        projects.splice(index, 1)
      }

      return index > -1
    },
    findMemberById: async (projectId: string, memberId: string) =>
      projectMembers.find(row => row.projectId === projectId && row.memberId === memberId) ?? null,
    findProjectByMemberId: async (memberId: string, projectId: string) =>
      projectMembers.find(row => row.projectId === projectId && row.memberId === memberId) ?? null,
    findProjectsByMemberId: async (memberId: string) =>
      projectMembers.filter(row => row.memberId === memberId).map(row => row.projectId),
    findMembers: async (projectId: string | string[]) =>
      projectMembers.filter(row => asArray(projectId).includes(row.projectId)),
    createMember: async (member: Row) => {
      if (
        projectMembers.some(
          row => row.projectId === member.projectId && row.memberId === member.memberId
        )
      ) {
        throw new Error('E11000 duplicate key: project member')
      }

      projectMembers.push({ ...member })
      return true
    },
    addMembers: async (members: Row[]) => {
      for (const member of members) {
        await projectService.createMember(member)
      }
    },
    deleteMember: async (projectId: string, memberId: string) => {
      const index = projectMembers.findIndex(
        row => row.projectId === projectId && row.memberId === memberId
      )

      if (index > -1) {
        projectMembers.splice(index, 1)
      }

      return index > -1
    },
    deleteMemberInProjects: async (projectIds: string[], memberId: string) => {
      const kept = projectMembers.filter(
        row => !(projectIds.includes(row.projectId) && row.memberId === memberId)
      )
      const deleted = kept.length < projectMembers.length

      projectMembers.splice(0, projectMembers.length, ...kept)
      return deleted
    }
  }

  const formService = {
    findById: async (id: string) => toDocument(forms.find(row => row.id === id)),
    findAll: async (projectId: string | string[], status: FormStatusEnum, keyword?: string) =>
      forms
        .filter(
          row =>
            asArray(projectId).includes(row.projectId) &&
            row.status === status &&
            (!keyword || String(row.name).toLowerCase().includes(keyword.toLowerCase()))
        )
        .map(toDocument),
    countMaps: async (projectIds: string[]) =>
      countBy(
        forms.filter(row => projectIds.includes(row.projectId)),
        'projectId'
      ),
    countAll: async (teamId: string) => forms.filter(row => row.teamId === teamId).length,
    create: async (form: Row) => {
      const id = nextId('form')
      forms.push({ id, updatedAt: new Date(0), ...form })
      return id
    },
    update: async (id: string, updates: Row) => {
      const form = forms.find(row => row.id === id)

      if (form) {
        applyUpdates(form, updates)
      }

      return true
    },
    // Like the real service, only a form in the trash can be deleted for good
    delete: async (formId: string | string[]) => {
      const kept = forms.filter(
        row => !(asArray(formId).includes(row.id) && row.status === FormStatusEnum.TRASH)
      )
      const deleted = kept.length < forms.length

      forms.splice(0, forms.length, ...kept)
      return deleted
    }
  }

  const submissionService = {
    countInForms: async (formIds: string[]) =>
      countBy(
        submissions.filter(row => formIds.includes(row.formId)),
        'formId'
      ),
    countAllInTeam: async (teamId: string) =>
      submissions.filter(row =>
        forms.some(form => form.id === row.formId && form.teamId === teamId)
      ).length,
    deleteAll: async (formId: string | string[]) => {
      const kept = submissions.filter(row => !asArray(formId).includes(row.formId))
      const deleted = kept.length < submissions.length

      submissions.splice(0, submissions.length, ...kept)
      return deleted
    },
    deleteByIds: async (formId: string, submissionIds?: string[]) => {
      const kept = submissions.filter(
        row => !(row.formId === formId && (!submissionIds || submissionIds.includes(row.id)))
      )
      const deleted = kept.length < submissions.length

      submissions.splice(0, submissions.length, ...kept)
      return deleted
    }
  }

  const userService = {
    findById: async (id: string) => users.find(row => row.id === id) ?? null,
    findAll: async (ids: string[]) =>
      users.filter(row => ids.includes(row.id)).map(row => ({ ...row }))
  }

  const guard = new PermissionGuard(
    new Reflector(),
    teamService as any,
    projectService as any,
    formService as any
  )

  // Runs the real guard for a signed-in user, and returns what it would hand to the resolver
  async function authorize(scope: PermissionScopeEnum, user: Row, input: Row) {
    const handler = () => undefined
    const req: Row = { user }

    Reflect.defineMetadata('scope', scope, handler)

    await guard.canActivate({
      getType: () => 'graphql',
      getArgs: () => [{}, { input }, { req }, {}],
      getClass: () => class TestResolver {},
      getHandler: () => handler,
      switchToHttp: () => ({ getRequest: () => req })
    } as any)

    return { team: req.team, project: req.project, form: req.form }
  }

  return {
    users,
    teams,
    teamMembers,
    projects,
    projectMembers,
    forms,
    submissions,
    teamService,
    projectService,
    formService,
    submissionService,
    userService,

    inTeam: (user: Row, teamId: string) => authorize(PermissionScopeEnum.team, user, { teamId }),
    // `claimed` is whatever else the request says about where the project is
    inProject: (user: Row, projectId: string, claimed: Row = {}) =>
      authorize(PermissionScopeEnum.project, user, { ...claimed, projectId }),
    inForm: (user: Row, formId: string) => authorize(PermissionScopeEnum.form, user, { formId }),

    addUser(name: string): Row {
      const id = nextId('user')
      const user = { id, name, email: `${name.toLowerCase()}@example.com`, lang: 'en' }

      users.push(user)
      return user
    },

    // A workspace as createTeam leaves it: the owner is an admin and sits in the first project
    async addTeam(owner: Row, name = 'Workspace') {
      const teamId = await teamService.create({ ownerId: owner.id, name, storageQuota: 0 })

      await teamService.createMember({ teamId, memberId: owner.id, role: TeamRoleEnum.ADMIN })

      const projectId = await projectService.create({ teamId, name: 'General', ownerId: owner.id })

      await projectService.createMember({ projectId, memberId: owner.id })
      return { teamId, projectId }
    },

    async addTeamMember(teamId: string, user: Row, role = TeamRoleEnum.COLLABORATOR) {
      await teamService.createMember({ teamId, memberId: user.id, role })
    },

    async addProject(teamId: string, owner: Row, name: string, members: Row[] = []) {
      const projectId = await projectService.create({ teamId, name, ownerId: owner.id })

      for (const member of new Set([owner, ...members])) {
        await projectService.createMember({ projectId, memberId: member.id })
      }

      return projectId
    },

    async addForm(form: Row) {
      return formService.create({
        name: 'Form',
        status: FormStatusEnum.NORMAL,
        settings: { active: true },
        fields: [],
        ...form
      })
    },

    addSubmission(formId: string): string {
      const id = nextId('submission')

      submissions.push({ id, formId })
      return id
    },

    teamMemberIds: (teamId: string) =>
      teamMembers.filter(row => row.teamId === teamId).map(row => row.memberId),
    projectMemberIds: (projectId: string) =>
      projectMembers.filter(row => row.projectId === projectId).map(row => row.memberId)
  }
}

export type WorkspaceStore = ReturnType<typeof createWorkspaceStore>
