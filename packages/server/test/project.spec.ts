import { INestApplication } from '@nestjs/common'
import { AuthService } from '@service'
import users from './fixtures/users'
import {
  ADD_PROJECT_MEMBER,
  CREATE_PROJECT,
  DELETE_PROJECT,
  DELETE_PROJECT_MEMBER,
  PROJECT_MEMBERS,
  PROJECTS,
  RENAME_PROJECT
} from './graphql'
import { _test, getApp } from './utils'

describe('Project', () => {
  let app: INestApplication
  let authService: AuthService

  beforeAll(async () => {
    app = await getApp()
    await app.init()

    authService = app.get<AuthService>(AuthService)

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
  })

  test('owner should create project', () => {
    return _test(app, users.owner, request => {
      return request
        .send({
          query: CREATE_PROJECT,
          variables: {
            input: {
              teamId: users.owner.teamId,
              name: 'project-owner-02'
            }
          }
        })
        .expect(200)
        .expect(res => {
          const projectId = res.body.data.createProject
          users.owner.CACHE_PROJECT_ID = projectId
          expect(projectId.length).toBe(8)
        })
    })
  })

  test('owner should list projects', () => {
    return _test(app, users.owner, request => {
      return request
        .send({
          query: PROJECTS,
          variables: {
            input: {
              teamId: users.owner.teamId
            }
          }
        })
        .expect(200)
        .expect(res => {
          const expected = [users.owner.projectId, users.owner.CACHE_PROJECT_ID]

          expect(res.body.data.projects.length).toBe(2)
          expect(res.body.data.projects.map(row => row.id)).toEqual(
            expect.arrayContaining(expected)
          )
        })
    })
  })

  test('member should list projects', () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: PROJECTS,
          variables: {
            input: {
              teamId: users.owner.teamId
            }
          }
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data.projects.length).toBe(1)
          expect(res.body.data.projects[0].id).toBe(users.owner.teamId)
        })
    })
  })

  test("owner should list owner project's members", () => {
    return _test(app, users.owner, request => {
      return request
        .send({
          query: PROJECT_MEMBERS,
          variables: {
            input: {
              projectId: users.owner.projectId
            }
          }
        })
        .expect(200)
        .expect(res => {
          const expected = [users.owner._id, users.member._id]

          expect(res.body.data.projectMembers.length).toBe(2)
          expect(res.body.data.projectMembers.map(row => row.id)).toEqual(
            expect.arrayContaining(expected)
          )
        })
    })
  })

  test("member should list member project's members", () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: PROJECT_MEMBERS,
          variables: {
            input: {
              projectId: users.member.projectId
            }
          }
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data.projectMembers.length).toBe(1)
          expect(res.body.data.projectMembers[0].id).toBe(users.member._id)
        })
    })
  })

  test('owner should add member to project', () => {
    return _test(app, users.owner, request => {
      return request
        .send({
          query: ADD_PROJECT_MEMBER,
          variables: {
            input: {
              projectId: users.owner.CACHE_PROJECT_ID,
              memberId: users.member._id
            }
          }
        })
        .expect(200)
        .expect({
          data: {
            addProjectMember: true
          }
        })
    })
  })

  test('member should rename project', () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: RENAME_PROJECT,
          variables: {
            input: {
              projectId: users.owner.CACHE_PROJECT_ID,
              name: 'project-owner-rename-02'
            }
          }
        })
        .expect(200)
        .expect({
          data: {
            renameProject: true
          }
        })
    })
  })

  test("member can't delete owner's project", () => {
    return _test(app, users.member, request => {
      return request
        .send({
          query: DELETE_PROJECT,
          variables: {
            input: {
              projectId: users.owner.CACHE_PROJECT_ID,
              code: '123456'
            }
          }
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data).toBe(null)
          expect(res.body.errors[0].message).toBe(
            "You don't have permission to delete the project"
          )
        })
    })
  })

  test("tester can't delete owner's project", () => {
    return _test(app, users.tester, request => {
      return request
        .send({
          query: DELETE_PROJECT,
          variables: {
            input: {
              projectId: users.owner.CACHE_PROJECT_ID,
              code: '123456'
            }
          }
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data).toBe(null)
          expect(res.body.errors[0].message).toBe(
            "You don't have permission to access the workspace"
          )
        })
    })
  })

  test("member can't remove owner from project", () => {
    return _test(app, users.owner, request => {
      return request
        .send({
          query: DELETE_PROJECT_MEMBER,
          variables: {
            input: {
              projectId: users.owner.CACHE_PROJECT_ID,
              memberId: users.owner._id
            }
          }
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data).toBe(null)
          expect(res.body.errors[0].message).toBe(
            "You don't have permission to remove member from the project"
          )
        })
    })
  })

  test('owner should remove member from project', () => {
    return _test(app, users.owner, request => {
      return request
        .send({
          query: DELETE_PROJECT_MEMBER,
          variables: {
            input: {
              projectId: users.owner.CACHE_PROJECT_ID,
              memberId: users.member._id
            }
          }
        })
        .expect(200)
        .expect({
          data: {
            deleteProjectMember: true
          }
        })
    })
  })

  test('owner should delete project', () => {
    return _test(app, users.owner, request => {
      return request
        .send({
          query: DELETE_PROJECT,
          variables: {
            input: {
              projectId: users.owner.CACHE_PROJECT_ID,
              code: '123456'
            }
          }
        })
        .expect(200)
        .expect({
          data: {
            deleteProject: true
          }
        })
    })
  })
})
