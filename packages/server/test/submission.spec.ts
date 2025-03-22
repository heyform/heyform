import { helper } from '@heyform-inc/utils'
import { INestApplication } from '@nestjs/common'
import users from './fixtures/users'
import { COMPLETE_SUBMISSION, OPEN_FORM, SUBMISSIONS } from './graphql'
import { _test, getApp } from './utils'

describe('Submission', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await getApp()
    await app.init()
  })

  test('should open form', () => {
    return _test(app, users.tester, request => {
      return request
        .send({
          query: OPEN_FORM,
          variables: {
            input: {
              formId: users.owner.formId
            }
          }
        })
        .expect(200)
        .expect(res => {
          const openForm = res.body.data.openForm
          users.tester.OPEN_FORM_TOKEN = openForm
          expect(helper.isValid(openForm) && helper.isString(openForm)).toBe(
            true
          )
        })
    })
  })

  test('should submit submission', () => {
    return _test(app, users.tester, request => {
      return request
        .send({
          query: COMPLETE_SUBMISSION,
          variables: {
            input: {
              formId: users.owner.formId,
              openToken: users.tester.OPEN_FORM_TOKEN,
              answers: {
                member_field_01: 'hello world'
              }
            }
          }
        })
        .expect(200)
        .expect({
          data: {
            completeSubmission: {
              clientSecret: null
            }
          }
        })
    })
  })

  test('should get submissions', () => {
    return _test(app, users.owner, request => {
      return request
        .send({
          query: SUBMISSIONS,
          variables: {
            input: {
              formId: users.owner.formId,
              category: 'inbox',
              page: 1
            }
          }
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data.submissions.total > 0).toBe(true)
          expect(res.body.data.submissions.submissions.length > 0).toBe(true)
        })
    })
  })
})
