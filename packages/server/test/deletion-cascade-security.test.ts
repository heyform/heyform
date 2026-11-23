import { FormStatusEnum } from '@heyform-inc/shared-types-enums'
import assert from 'assert'

import { DeleteProjectCodeResolver } from '../src/resolver/project/delete-project-code.resolver'
import { DeleteProjectResolver } from '../src/resolver/project/delete-project.resolver'
import { DissolveTeamCodeResolver } from '../src/resolver/team/dissolve-team-code.resolver'
import { DissolveTeamResolver } from '../src/resolver/team/dissolve-team.resolver'
import { UserDeletionCodeResolver } from '../src/resolver/user/user-deletion-code.resolver'
import { DeleteUserAccountSchedule } from '../src/schedule/delete-user-account.schedule'
import { FormService } from '../src/service/form.service'
import { TeamService } from '../src/service/team.service'

const DISABLE_FORM_UPDATE = {
  'settings.active': false,
  status: FormStatusEnum.TRASH
}

async function testDeletionCodeEmailsUseRateLimitedGeneration() {
  const keys: string[] = []
  const emails: string[] = []
  const authService = {
    getVerificationCodeWithRateLimit: async (key: string) => {
      keys.push(key)
      return '123456'
    },
    getVerificationCode: async () => {
      throw new Error('unthrottled verification code generation must not be used')
    }
  }
  const mailService = {
    isConfigured: () => true,
    accountDeletionRequest: async () => {
      emails.push('account')
    },
    teamDeletionRequest: async () => {
      emails.push('workspace')
    },
    projectDeletionRequest: async () => {
      emails.push('project')
    }
  }

  await new UserDeletionCodeResolver(mailService as any, authService as any).userDeletionCode({
    id: 'user_1',
    email: 'owner@example.com',
    lang: 'en'
  } as any)
  await new DissolveTeamCodeResolver(authService as any, mailService as any).dissolveTeamCode(
    { id: 'team_1', isOwner: true, name: 'Workspace' } as any,
    { id: 'user_1', email: 'owner@example.com', lang: 'en' } as any,
    { teamId: 'team_1' }
  )
  const isEmailConfirmation = await new DeleteProjectCodeResolver(
    authService as any,
    mailService as any
  ).deleteProjectCode(
    { id: 'team_1', isOwner: true, name: 'Workspace' } as any,
    { id: 'project_1', name: 'Project' } as any,
    { id: 'user_1', email: 'owner@example.com', lang: 'en' } as any,
    { projectId: 'project_1' }
  )

  assert.strictEqual(isEmailConfirmation, true)
  assert.deepStrictEqual(keys, [
    'user_deletion:user_1',
    'verify_dissolve_team:team_1:user_1',
    'verify_delete_project:project_1:user_1'
  ])
  assert.deepStrictEqual(emails, ['account', 'workspace', 'project'])
}

async function testFindAllInProjectDoesNotExcludeActiveForms() {
  let conditions: Record<string, any> | undefined
  const formService = new FormService(
    {
      find: async (value: Record<string, any>) => {
        conditions = value
        return []
      }
    } as any,
    {} as any,
    {} as any,
    {} as any
  )

  await formService.findAllInProject('project_1')

  assert.deepStrictEqual(conditions, { projectId: 'project_1' })
}

async function testProjectDeletionDisablesAndPurgesFormsBeforeProject() {
  const events: string[] = []
  const resolver = new DeleteProjectResolver(
    {
      attemptsCheck: async (_key: string, check: () => Promise<void>) => check(),
      checkVerificationCode: async () => {
        events.push('verification')
      }
    } as any,
    {
      deleteAllMemberInProject: async () => {
        events.push('delete project members')
      },
      delete: async () => {
        events.push('delete project')
      }
    } as any,
    {
      findAllInProject: async () => {
        events.push('find forms')
        return [{ id: 'form_1' }, { id: 'form_2' }]
      },
      updateMany: async (formIds: string[], updates: Record<string, any>) => {
        assert.deepStrictEqual(formIds, ['form_1', 'form_2'])
        assert.deepStrictEqual(updates, DISABLE_FORM_UPDATE)
        events.push('disable forms')
      },
      delete: async () => {
        events.push('delete forms')
      }
    } as any,
    {
      deleteAll: async () => {
        events.push('delete submissions')
      }
    } as any,
    {
      isConfigured: () => true,
      projectDeletionAlert: () => {
        events.push('send alert')
      }
    } as any
  )

  await resolver.deleteProject(
    { id: 'team_1', isOwner: true, name: 'Workspace' } as any,
    { id: 'project_1', name: 'Project' } as any,
    { email: 'owner@example.com', lang: 'en', name: 'Owner' } as any,
    { projectId: 'project_1', code: '123456' }
  )

  assert.deepStrictEqual(events, [
    'verification',
    'find forms',
    'disable forms',
    'delete submissions',
    'delete forms',
    'delete project members',
    'delete project',
    'send alert'
  ])
}

async function testProjectDeletionUsesNameWithoutSmtp() {
  const events: string[] = []
  const authService = {
    getVerificationCodeWithRateLimit: async () => {
      throw new Error('verification codes must not be generated without SMTP')
    },
    attemptsCheck: async () => {
      throw new Error('verification codes must not be checked without SMTP')
    }
  }
  const mailService = {
    isConfigured: () => false,
    projectDeletionRequest: async () => {
      throw new Error('deletion codes must not be emailed without SMTP')
    },
    projectDeletionAlert: async () => {
      throw new Error('deletion alerts must not be emailed without SMTP')
    }
  }
  const team = { id: 'team_1', isOwner: true, name: 'Workspace' } as any
  const project = { id: 'project_1', name: 'Project' } as any
  const user = { email: 'owner@example.com', lang: 'en', name: 'Owner' } as any

  const isEmailConfirmation = await new DeleteProjectCodeResolver(
    authService as any,
    mailService as any
  ).deleteProjectCode(team, project, user, { projectId: project.id })

  assert.strictEqual(isEmailConfirmation, false)

  const resolver = new DeleteProjectResolver(
    authService as any,
    {
      deleteAllMemberInProject: async () => {
        events.push('delete project members')
      },
      delete: async () => {
        events.push('delete project')
      }
    } as any,
    {
      findAllInProject: async () => {
        events.push('find forms')
        return []
      },
      updateMany: async () => {
        throw new Error('forms must not be updated when none exist')
      },
      delete: async () => {
        throw new Error('forms must not be deleted when none exist')
      }
    } as any,
    {
      deleteAll: async () => {
        throw new Error('submissions must not be deleted when no forms exist')
      }
    } as any,
    mailService as any
  )

  await assert.rejects(
    resolver.deleteProject(team, project, user, {
      projectId: project.id,
      name: 'Wrong project'
    }),
    /The project name does not match/
  )
  assert.deepStrictEqual(events, [])

  await resolver.deleteProject(team, project, user, {
    projectId: project.id,
    name: project.name
  })

  assert.deepStrictEqual(events, ['find forms', 'delete project members', 'delete project'])
}

async function testWorkspaceDeletionDisablesAndPurgesFormsBeforeWorkspace() {
  const events: string[] = []
  const resolver = new DissolveTeamResolver(
    {
      attemptsCheck: async (_key: string, check: () => Promise<void>) => check(),
      checkVerificationCode: async () => {
        events.push('verification')
      }
    } as any,
    {
      findById: async () => ({ id: 'team_1', ownerId: 'user_1' }),
      withMembershipLock: async (_teamId: string, run: () => Promise<void>) => run(),
      deleteAllMemberInTeam: async () => {
        events.push('delete workspace members')
      },
      delete: async () => {
        events.push('delete workspace')
      }
    } as any,
    {
      findAllInTeam: async () => {
        events.push('find forms')
        return [{ id: 'form_1' }]
      },
      updateMany: async (_formIds: string[], updates: Record<string, any>) => {
        assert.deepStrictEqual(updates, DISABLE_FORM_UPDATE)
        events.push('disable forms')
      },
      delete: async () => {
        events.push('delete forms')
      }
    } as any,
    {
      deleteAll: async () => {
        events.push('delete submissions')
      }
    } as any,
    {
      teamDeletionAlert: () => {
        events.push('send alert')
      }
    } as any
  )

  await resolver.dissolveTeam(
    { id: 'team_1', isOwner: true, name: 'Workspace' } as any,
    { id: 'user_1', email: 'owner@example.com', lang: 'en', name: 'Owner' } as any,
    { teamId: 'team_1', code: '123456' }
  )

  assert.deepStrictEqual(events, [
    'verification',
    'find forms',
    'disable forms',
    'delete submissions',
    'delete forms',
    'delete workspace members',
    'delete workspace',
    'send alert'
  ])
}

async function testAccountDeletionCleansOwnedWorkspaceBeforeUser() {
  const events: string[] = []
  const schedule = new DeleteUserAccountSchedule(
    {
      findAllDeletionScheduled: async () => [
        { id: 'user_1', email: 'owner@example.com', lang: 'en' }
      ],
      delete: async () => {
        events.push('delete user')
      }
    } as any,
    {
      deleteByUserId: async () => {
        events.push('delete social logins')
      }
    } as any,
    {
      findAllForAccountDeletion: async () => [
        { id: 'owned_team', ownerId: 'user_1' },
        { id: 'joined_team', ownerId: 'another_user' }
      ],
      deleteAllMemberInTeam: async () => {
        events.push('delete workspace members')
      },
      delete: async () => {
        events.push('delete workspace')
      },
      removeAccountFromTeam: TeamService.prototype.removeAccountFromTeam,
      withMembershipLock: async (_teamId: string, run: () => Promise<void>) => run(),
      findById: async (id: string) => ({
        id,
        ownerId: id === 'owned_team' ? 'user_1' : 'another_user'
      }),
      deleteMemberRecord: async () => {
        events.push('leave joined workspace')
      }
    } as any,
    {
      findAllInTeam: async () => {
        events.push('find forms')
        return [{ id: 'form_1' }]
      },
      updateMany: async (_formIds: string[], updates: Record<string, any>) => {
        assert.deepStrictEqual(updates, DISABLE_FORM_UPDATE)
        events.push('disable forms')
      },
      delete: async () => {
        events.push('delete forms')
      }
    } as any,
    {
      deleteAll: async () => {
        events.push('delete submissions')
      }
    } as any,
    {
      accountDeletionAlert: async () => {
        events.push('send alert')
      }
    } as any
  )

  await schedule.deleteUserAccount()

  assert.deepStrictEqual(events, [
    'find forms',
    'disable forms',
    'delete submissions',
    'delete forms',
    'delete workspace members',
    'delete workspace',
    'leave joined workspace',
    'delete social logins',
    'delete user',
    'send alert'
  ])
}

async function run() {
  await testDeletionCodeEmailsUseRateLimitedGeneration()
  await testFindAllInProjectDoesNotExcludeActiveForms()
  await testProjectDeletionDisablesAndPurgesFormsBeforeProject()
  await testProjectDeletionUsesNameWithoutSmtp()
  await testWorkspaceDeletionDisablesAndPurgesFormsBeforeWorkspace()
  await testAccountDeletionCleansOwnedWorkspaceBeforeUser()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
