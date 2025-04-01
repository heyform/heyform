import { INestApplication } from '@nestjs/common'
import { AuthService } from '@service'
import mongoose from 'mongoose'
import users from './fixtures/users'
import {
  CREATE_TEAM,
  DISSOLVE_TEAM,
  JOIN_TEAM,
  PUBLIC_TEAM_DETAIL,
  TEAM_MEMBERS,
  TEAMS,
  UPDATE_TEAM_SETTINGS
} from './graphql'
import { _test, getApp } from './utils'

describe('Team', () => {
  let app: INestApplication
  let authService: AuthService

  beforeAll(async () => {
    app = await getApp()
    await app.init()

    authService = app.get<AuthService>(AuthService)
  })

  test('tester should create team', () => {
    return _test(app, users.tester, request => {
      return request
        .send({
          query: CREATE_TEAM,
          variables: {
            input: {
              name: users.tester.name
            }
          }
        })
        .expect(200)
        .expect(res => {
          users.tester.CACHE_TEAM_ID = res.body.data.createTeam
          expect(users.tester.CACHE_TEAM_ID.length).toBe(8)
        })
    })
  })

  test('owner should list teams', () => {
    return _test(app, users.owner, request => {
      return request
        .send({
          query: TEAMS
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data.teams.length).toBe(1)
          expect(res.body.data.teams[0].id).toBe(users.owner.teamId)
          expect(res.body.data.teams[0].ownerId).toBe(users.owner._id)
          expect(res.body.data.teams[0].projects.map(row => row.id)).toContain(
            users.owner.projectId
          )
        })
    })
  })

  test('member should list teams', () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: TEAMS
        })
        .expect(200)
        .expect(res => {
          const expected = [users.owner.teamId, users.member.teamId]

          expect(res.body.data.teams.length).toBe(2)
          expect(res.body.data.teams.map(row => row.id)).toEqual(
            expect.arrayContaining(expected)
          )
        })
    })
  })

  test('tester should list teams', () => {
    return _test(app, users.tester, request => {
      return request
        .send({
          query: TEAMS
        })
        .expect(200)
        .expect(res => {
          const { teams } = res.body.data
          const team = teams.find(row => row.id === users.tester.CACHE_TEAM_ID)

          users.tester.CACHE_INVITE_CODE = team.inviteCode

          expect(teams.length).toBe(2)
          expect(team.name).toBe(users.tester.name)
        })
    })
  })

  test('owner should list team members', () => {
    return _test(app, users.owner, request => {
      return request
        .send({
          query: TEAM_MEMBERS,
          variables: {
            input: {
              teamId: users.owner.teamId
            }
          }
        })
        .expect(200)
        .expect(res => {
          const { teamMembers } = res.body.data
          const owner = teamMembers.find(row => row.id === users.owner._id)
          const member = teamMembers.find(row => row.id === users.member._id)

          expect(res.body.data.teamMembers.length).toBe(2)
          expect(owner.isOwner).toBe(true)
          expect(member.isOwner).toBe(false)
        })
    })
  })

  test('member should list team members', () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: TEAM_MEMBERS,
          variables: {
            input: {
              teamId: users.owner.teamId
            }
          }
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data.teamMembers.length).toBe(2)
        })
    })
  })

  test('pro plan should update custom domain', () => {
    return _test(app, users.owner, request => {
      return request
        .send({
          query: UPDATE_TEAM_SETTINGS,
          variables: {
            input: {
              teamId: users.owner.teamId,
              name: users.owner.teamName
              // enableCustomDomain: true
            }
          }
        })
        .expect(200)
        .expect({
          data: {
            updateTeam: true
          }
        })
    })
  })

  test('pro plan update whitelabel branding', () => {
    return _test(app, users.owner, request => {
      return request
        .send({
          query: UPDATE_TEAM_SETTINGS,
          variables: {
            input: {
              teamId: users.owner.teamId,
              removeBranding: true
            }
          }
        })
        .expect(200)
        .expect({
          data: {
            updateTeam: true
          }
        })
    })
  })

  test("free plan can't set custom domain", () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: UPDATE_TEAM_SETTINGS,
          variables: {
            input: {
              teamId: users.member.teamId
              // enableCustomDomain: true
            }
          }
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data).toBe(null)
          expect(res.body.errors[0].message).toBe(
            'Upgrade your plan to add custom domain'
          )
        })
    })
  })

  test("free plan can't remove branding", () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: UPDATE_TEAM_SETTINGS,
          variables: {
            input: {
              teamId: users.member.teamId,
              removeBranding: true
            }
          }
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data).toBe(null)
          expect(res.body.errors[0].message).toBe(
            'Upgrade your plan to remove branding'
          )
        })
    })
  })

  test("member can't update team settings", () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: UPDATE_TEAM_SETTINGS,
          variables: {
            input: {
              teamId: users.owner.teamId,
              name: users.owner.teamName
            }
          }
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data).toBe(null)
          expect(res.body.errors[0].message).toBe(
            "You don't have permission to change the workspace settings"
          )
        })
    })
  })

  test("member should get tester's public team detail", () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: PUBLIC_TEAM_DETAIL,
          variables: {
            input: {
              teamId: users.tester.CACHE_TEAM_ID,
              inviteCode: users.tester.CACHE_INVITE_CODE
            }
          }
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data.publicTeamDetail.owner.name).toBe(
            users.tester.name
          )
        })
    })
  })

  test("member should not join tester's team by invite code", () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: JOIN_TEAM,
          variables: {
            input: {
              teamId: users.tester.CACHE_TEAM_ID,
              inviteCode: users.tester.CACHE_INVITE_CODE
            }
          }
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data).toBe(null)
          expect(res.body.errors[0].message).toBe(
            'The workspace member quota exceeds, new members are no longer accepted'
          )
        })
    })
  })

  test('tester should dissolve team', () => {
    jest
      .spyOn(authService, 'getVerificationCode')
      .mockImplementation(async () => {
        return '123456'
      })

    jest
      .spyOn(authService, 'checkVerificationCode')
      .mockImplementation(async () => {
        //
      })

    return _test(app, users.tester, request => {
      return request
        .send({
          query: DISSOLVE_TEAM,
          variables: {
            input: {
              teamId: users.tester.CACHE_TEAM_ID,
              code: '123456'
            }
          }
        })
        .expect(200)
        .expect({
          data: {
            dissolveTeam: true
          }
        })
    })
  })

  afterAll(async () => {
    await mongoose.connection.close(true)
    await app.close()
  })
})
