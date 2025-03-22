import { MONGO_URI } from '@environments'
import { helper } from '@heyform-inc/utils'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { exec } from 'child_process'
import * as cookieParser from 'cookie-parser'
import * as setCookie from 'set-cookie-parser'
import * as supertest from 'supertest'
import { AppModule } from '../src/app.module'

export async function getCookie(
  app: INestApplication,
  user: any
): Promise<string> {
  const res = await supertest(app.getHttpServer())
    .post('/graphql')
    .set('user-id', user.deviceId)
    .send({
      operationName: null,
      query: `query login($input: LoginInput!) {
          login(input: $input)
        }`,
      variables: {
        input: {
          email: user.email,
          password: user.password
        }
      }
    })

  return setCookie
    .parse(res)
    .map(({ name, value }) => {
      return [name, value].join('=')
    })
    .join(';')
}

export async function getApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule]
  }).compile()

  const app = moduleFixture.createNestApplication()
  app.use(cookieParser())

  return app
}

export function getRequest(
  app: any,
  user: any,
  cookie: string
): supertest.Test {
  return supertest(app.getHttpServer())
    .post('/graphql')
    .set('user-id', user.deviceId)
    .set('x-anonymous-id', user.deviceId)
    .set('cookie', cookie)
}

const COOKIE_CACHE: Record<string, any> = {}

export async function _test(app: any, user: any, callback: Function) {
  const userId = user._id
  let cookie = COOKIE_CACHE[userId]

  if (helper.isEmpty(cookie)) {
    cookie = await getCookie(app, user)
    COOKIE_CACHE[userId] = cookie
  }

  const request = getRequest(app, user, cookie)
  return callback(request)
}

export function dropDatabase(): Promise<string> {
  return new Promise((resolve, reject) => {
    const dbName = MONGO_URI.replace(/.*\//, '')
    exec(`mongo ${dbName} --eval "db.dropDatabase()"`, (err, stdout) => {
      if (err) {
        return reject(err)
      }
      resolve(stdout)
    })
  })
}
