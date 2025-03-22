import { INestApplication } from '@nestjs/common'
import { MailService } from '@service'
import * as mongoose from 'mongoose'
import * as request from 'supertest'
import { LOGIN, SIGN_UP } from './graphql'
import { getApp } from './utils'

describe('Auth', () => {
  let app: INestApplication
  let mailService: MailService

  beforeAll(async () => {
    app = await getApp()
    await app.init()

    mailService = app.get<MailService>(MailService)
  })

  test('should sign up', () => {
    jest.spyOn(mailService, 'welcome').mockImplementation(async () => {
      // pass, don't send any email
    })
    jest
      .spyOn(mailService, 'emailVerificationRequest')
      .mockImplementation(async () => {
        // pass, don't send any email
      })

    return request(app.getHttpServer())
      .post('/graphql')
      .set('user-id', 'temp-id')
      .send({
        query: SIGN_UP,
        variables: {
          input: {
            name: 'temp',
            email: 'temp@heyform.net',
            password: 'temp_Passw0rd'
          }
        }
      })
      .expect(200)
      .expect({
        data: {
          signUp: true
        }
      })
  })

  test('should login', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .set('user-id', 'temp-id')
      .send({
        query: LOGIN,
        variables: {
          input: {
            email: 'temp@heyform.net',
            password: 'temp_Passw0rd'
          }
        }
      })
      .expect(200)
      .expect({
        data: {
          login: true
        }
      })
  })

  afterAll(async () => {
    await mongoose.connection.close(true)
    await app.close()
  })
})
