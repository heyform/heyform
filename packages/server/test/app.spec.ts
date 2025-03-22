import { INestApplication } from '@nestjs/common'
import users from './fixtures/users'
import { APP_AUTHORIZE_URL, APP_DETAIL, APPS } from './graphql'
import { _test, getApp } from './utils'

describe('App', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await getApp()
    await app.init()
  })

  test('should get apps', () => {
    return _test(app, users.owner, request => {
      return request
        .send({
          query: APPS
        })
        .expect(200)
        .expect(res => {
          const apps = res.body.data.apps
          expect(apps.length).toBe(2)
        })
    })
  })

  test('should get app detail', () => {
    return _test(app, users.owner, request => {
      return request
        .send({
          query: APP_DETAIL,
          variables: {
            input: {
              clientId: 's5jgFLiwebhpmz31HuXT',
              redirectUri: 'https://zapier.com/oauth/v2/callback'
            }
          }
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data.appDetail.uniqueId).toBe('zapier')
        })
    })
  })

  test('should get app authorization code', () => {
    return _test(app, users.owner, request => {
      return request
        .send({
          query: APP_AUTHORIZE_URL,
          variables: {
            input: {
              clientId: 's5jgFLiwebhpmz31HuXT',
              redirectUri: 'https://zapier.com/oauth/v2/callback',
              responseType: 'code'
            }
          }
        })
        .expect(200)
        .expect(res => {
          expect(
            res.body.data.appAuthorizeUrl.startsWith(
              'https://zapier.com/oauth/v2/callback?code='
            )
          ).toBe(true)
        })
    })
  })
})
