import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { RedisService } from './redis.service'
import {
  COOKIE_DEVICE_ID_NAME,
  COOKIE_LOGIN_IN_NAME,
  COOKIE_SESSION_NAME,
  CookieOptionsFactory,
  SessionOptionsFactory
} from '@config'
import {
  SESSION_KEY,
  SESSION_MAX_AGE,
  VERIFICATION_CODE_EXPIRE,
  VERIFICATION_CODE_LIMIT,
  VERIFY_EMAIL_RESEND_COOLDOWN,
  VERIFY_EMAIL_RESEND_DAILY_LIMIT
} from '@environments'
import {
  helper,
  hs,
  ms,
  isDateExpired,
  nanoid,
  parseNumber,
  random,
  timestamp
} from '@heyform-inc/utils'
import { UserActivityKindEnum, UserActivityModel } from '@model'
import { aesDecryptObject, aesEncryptObject } from '@utils'
import { UserAgent } from '@utils'

interface UserActivity {
  kind: UserActivityKindEnum
  userId: string
  deviceId: string
  ip: string
  userAgent: UserAgent
}

interface LoginOptions {
  res: any
  userId: string
  deviceId: string
}

interface AttemptsCheckOptions {
  max?: number
  expire?: string
}

const DEFAULT_ATTEMPTS_OPTIONS = {
  max: 5,
  expire: '15m'
}
const NUMERIC_ALPHABET = '0123456789'
const OAUTH_STATE_COOKIE_NAME = 'HEYFORM_OAUTH_STATE'
const OAUTH_STATE_MAX_AGE = ms('10m')
const OAUTH_TRANSACTION_TTL = '10m'

export interface OAuthTransaction {
  codeVerifier: string
  nonce: string
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserActivityModel.name)
    private readonly userActivityModel: Model<UserActivityModel>,
    private readonly redisService: RedisService
  ) {}

  private static sessionKey(userId: string): string {
    return `sess:${userId}`
  }

  async invalidateSessions(userId: string): Promise<void> {
    await this.redisService.del(AuthService.sessionKey(userId))
  }

  async devices(userId: string): Promise<string[]> {
    const key = AuthService.sessionKey(userId)
    const result = await this.redisService.hget({
      key
    })

    return Object.keys(result as object)
  }

  getDeviceId(req: any): string {
    return req.cookies?.[COOKIE_DEVICE_ID_NAME] || req.headers?.['x-device-id'] || nanoid()
  }

  async createOAuthState(req: any, res: any, deviceId: string): Promise<string> {
    const state = nanoid(32)
    const key = `oauth_state:${state}`

    await this.redisService.set({
      key,
      value: this.getDeviceId({
        ...req,
        headers: {
          ...req.headers,
          'x-device-id': deviceId
        }
      }),
      duration: '10m'
    })

    res.cookie(
      OAUTH_STATE_COOKIE_NAME,
      state,
      CookieOptionsFactory({
        httpOnly: true,
        maxAge: OAUTH_STATE_MAX_AGE,
        path: '/connect',
        sameSite: 'none',
        secure: true
      })
    )

    return state
  }

  async storeOAuthTransaction(state: string, transaction: OAuthTransaction): Promise<void> {
    if (
      helper.isEmpty(state) ||
      helper.isEmpty(transaction?.codeVerifier) ||
      helper.isEmpty(transaction?.nonce)
    ) {
      throw new BadRequestException('Invalid OAuth transaction')
    }

    await this.redisService.set({
      key: `oauth_transaction:${state}`,
      value: JSON.stringify(transaction),
      duration: OAUTH_TRANSACTION_TTL
    })
  }

  async consumeOAuthTransaction(state?: string): Promise<OAuthTransaction> {
    if (helper.isEmpty(state)) {
      throw new BadRequestException('Invalid OAuth transaction')
    }

    const value = await this.redisService.getdel(`oauth_transaction:${state}`)

    if (helper.isEmpty(value)) {
      throw new BadRequestException('Invalid OAuth transaction')
    }

    try {
      const transaction = JSON.parse(value!) as OAuthTransaction

      if (helper.isEmpty(transaction.codeVerifier) || helper.isEmpty(transaction.nonce)) {
        throw new Error('Incomplete OAuth transaction')
      }

      return transaction
    } catch (_) {
      throw new BadRequestException('Invalid OAuth transaction')
    }
  }

  async verifyOAuthState(req: any, res: any, state?: string): Promise<void> {
    const cookieState = req.cookies?.[OAUTH_STATE_COOKIE_NAME]

    if (helper.isEmpty(state) || state !== cookieState) {
      throw new BadRequestException('Invalid OAuth state')
    }

    const key = `oauth_state:${state}`
    const deviceId = await this.redisService.getdel(key)

    if (helper.isEmpty(deviceId)) {
      throw new BadRequestException('Invalid OAuth state')
    }

    req.headers = {
      ...req.headers,
      'x-device-id': deviceId
    }
    req.cookies = {
      ...req.cookies,
      [COOKIE_DEVICE_ID_NAME]: deviceId
    }

    res.clearCookie(
      OAUTH_STATE_COOKIE_NAME,
      CookieOptionsFactory({
        maxAge: 0,
        path: '/connect',
        sameSite: 'none',
        secure: true
      })
    )
  }

  async login({ res, userId, deviceId }: LoginOptions): Promise<void> {
    const maxLoginNum = 20
    const loginAt = timestamp()
    const key = AuthService.sessionKey(userId)

    await this.redisService.hset({
      key,
      field: deviceId,
      value: loginAt,
      duration: SESSION_MAX_AGE
    })

    const devices = await this.devices(userId)
    const len = devices.length

    if (len > maxLoginNum) {
      await this.redisService.hdel({
        key,
        field: devices.splice(0, len - maxLoginNum)
      })
    }

    this.setSession(res, {
      loginAt: timestamp(),
      deviceId,
      id: userId
    })
    res.cookie(COOKIE_LOGIN_IN_NAME, true, CookieOptionsFactory())
  }

  setSession(res: any, jsonObject: Record<string, any>): void {
    const value = aesEncryptObject(jsonObject, SESSION_KEY)
    res.cookie(COOKIE_SESSION_NAME, value, SessionOptionsFactory())
  }

  getSession(req: any): any {
    const cookie = req.cookies[COOKIE_SESSION_NAME]

    try {
      return aesDecryptObject(cookie, SESSION_KEY)
    } catch (_) {}
  }

  async removeSession(req: any, res: any): Promise<void> {
    const session = this.getSession(req)

    if (helper.isValid(session?.id) && helper.isValid(session?.deviceId)) {
      await this.redisService.hdel({
        key: AuthService.sessionKey(session.id),
        field: session.deviceId
      })
    }

    const sessionCookieOptions = SessionOptionsFactory({
      expires: new Date(0),
      maxAge: 0,
      path: '/'
    })
    const loginCookieOptions = CookieOptionsFactory({
      expires: new Date(0),
      maxAge: 0,
      path: '/'
    })

    res.clearCookie(COOKIE_SESSION_NAME, sessionCookieOptions)
    res.clearCookie(COOKIE_LOGIN_IN_NAME, loginCookieOptions)
    res.cookie(COOKIE_SESSION_NAME, '', sessionCookieOptions)
    res.cookie(COOKIE_LOGIN_IN_NAME, '', loginCookieOptions)
  }

  async isExpired(userId: string, deviceId: string): Promise<boolean> {
    const key = `sess:${userId}`
    const result = await this.redisService.hget({
      key,
      field: deviceId
    })
    const loginAt = Number(result)

    if (helper.isEmpty(result) || helper.isNan(loginAt)) {
      return true
    }

    return isDateExpired(loginAt, timestamp(), SESSION_MAX_AGE)
  }

  async renew(userId: string, deviceId: string): Promise<void> {
    const key = `sess:${userId}`
    const now = timestamp()

    await this.redisService.hset({
      key,
      field: deviceId,
      value: now,
      duration: SESSION_MAX_AGE
    })
  }

  async createUserActivity(userActivity: UserActivity): Promise<UserActivityModel> {
    return this.userActivityModel.create(userActivity as any)
  }

  async failRemaining(key: string, max: number): Promise<number> {
    const result = await this.redisService.get(key)
    const amount = parseNumber(result, 0)
    return max - amount
  }

  async failIncrease(key: string): Promise<void> {
    await this.redisService.multi([
      ['incr', key],
      ['expire', key, String(hs('15m'))]
    ])
  }

  async attemptsCheck(
    key: string,
    checkFunc: () => Promise<void>,
    customOptions?: AttemptsCheckOptions
  ): Promise<void> {
    const options = {
      ...{},
      ...DEFAULT_ATTEMPTS_OPTIONS,
      ...customOptions
    }

    // Reserve the attempt before checking the credential. The Redis operation is atomic, so a
    // concurrent burst cannot have every request observe the same stale counter value.
    const count = await this.redisService.incrementWithExpiry(key, options.expire)

    if (count > options.max) {
      throw new ForbiddenException('Limit exceeded. Please try again later.')
    }

    await checkFunc()
  }

  async clearAttempts(key: string): Promise<void> {
    await this.redisService.del(key)
  }

  async getVerificationCode(
    key: string,
    length = 6,
    type: string = NUMERIC_ALPHABET
  ): Promise<string> {
    const code = random(length, type)

    await this.redisService.hset({
      key,
      field: code,
      value: timestamp() + hs(VERIFICATION_CODE_EXPIRE),
      duration: VERIFICATION_CODE_EXPIRE
    })

    // Delete the oldest one if the number of code is exceeded the VERIFICATION_CODE_LIMIT
    const result = await this.redisService.hget({ key })
    const fields = Object.keys(result as object)
    const count = fields.length

    if (count > VERIFICATION_CODE_LIMIT) {
      await this.redisService.hdel({
        key,
        field: fields.splice(0, count - VERIFICATION_CODE_LIMIT)
      })
    }

    return code
  }

  async getVerificationCodeWithRateLimit(key: string): Promise<string> {
    const cooldownKey = `cooldown:${key}`
    const dailyLimitKey = `limit:day:${key}`
    const now = timestamp()
    const cooldownMs = hs(VERIFY_EMAIL_RESEND_COOLDOWN)
    const dailyCount = parseNumber(await this.redisService.get(dailyLimitKey), 0)

    if (dailyCount >= VERIFY_EMAIL_RESEND_DAILY_LIMIT) {
      throw new ForbiddenException('Too many code emails sent today. Please try again later.')
    }

    const cooldownUntil = parseNumber(await this.redisService.get(cooldownKey), 0)

    if (cooldownUntil > now) {
      const waitSeconds = Math.ceil((cooldownUntil - now) / 1000)
      const unit = waitSeconds === 1 ? 'second' : 'seconds'
      throw new ForbiddenException(
        `Please wait ${waitSeconds} ${unit} before requesting another code email.`
      )
    }

    const code = await this.getVerificationCode(key)

    if (dailyCount > 0) {
      await this.redisService.incr(dailyLimitKey)
    } else {
      await this.redisService.multi([
        ['incr', dailyLimitKey],
        ['expire', dailyLimitKey, hs('1d')]
      ])
    }

    await this.redisService.set({
      key: cooldownKey,
      value: now + cooldownMs,
      duration: VERIFY_EMAIL_RESEND_COOLDOWN
    })

    return code
  }

  async checkVerificationCode(key: string, code: string): Promise<void> {
    const cache = await this.redisService.hgetdel({
      key,
      field: code
    })

    if (!helper.isValid(cache)) {
      throw new BadRequestException('Invalid verification code')
    }

    const expired = parseNumber(cache)

    if (expired < timestamp()) {
      throw new BadRequestException('Verification code expired')
    }
  }
}
