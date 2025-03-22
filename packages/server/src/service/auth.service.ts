import {
  COOKIE_LOGIN_IN_NAME,
  COOKIE_SESSION_NAME,
  CookieOptionsFactory,
  SessionOptionsFactory
} from '@config'
import {
  GEETEST4_CAPTCHA_ID,
  GEETEST4_CAPTCHA_KEY,
  SESSION_KEYS,
  SESSION_MAX_AGE,
  VERIFICATION_CODE_EXPIRE,
  VERIFICATION_CODE_LIMIT
} from '@environments'
import { aesDecryptObject, aesEncryptObject } from '@heyforms/nestjs'
import { GeoLocation } from '@heyforms/nestjs'
import { UserAgent } from '@heyforms/nestjs'
import {
  helper,
  hs,
  isDateExpired,
  parseNumber,
  random,
  RandomType,
  timestamp
} from '@heyform-inc/utils'
import { UserActivityKindEnum, UserActivityModel } from '@model'
import {
  BadRequestException,
  ForbiddenException,
  Injectable
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
  GeeTest,
  GeeTestValidateOptions,
  GeeTestValidateResponse
} from 'gt4-node-sdk'
import { Model } from 'mongoose'
import { RedisService } from './redis.service'

interface UserActivity {
  kind: UserActivityKindEnum
  userId: string
  deviceId: string
  ip: string
  geoLocation: GeoLocation
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

  async devices(userId: string): Promise<string[]> {
    const key = AuthService.sessionKey(userId)
    const result = await this.redisService.hget({
      key
    })

    return Object.keys(result as Object)
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

    // If more than maxLoginNum devices are logged in, delete earlier sessions
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
    const value = aesEncryptObject(jsonObject, SESSION_KEYS[0])
    res.cookie(COOKIE_SESSION_NAME, value, SessionOptionsFactory())
  }

  getSession(req: any): any {
    const cookie = req.cookies[COOKIE_SESSION_NAME]

    try {
      // 如果 session cookie 值不符合规则，decrypt 会导致错误
      // 应该返回 undefined
      return aesDecryptObject(cookie, SESSION_KEYS[0])
    } catch (_) {}
  }

  removeSession(res: any): void {
    res.cookie(
      COOKIE_SESSION_NAME,
      '',
      SessionOptionsFactory({
        maxAge: 0
      })
    )
    res.cookie(
      COOKIE_LOGIN_IN_NAME,
      '',
      CookieOptionsFactory({
        maxAge: 0
      })
    )
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

  /**
   * Create user activity
   *
   * @param userActivity
   */
  async createUserActivity(
    userActivity: UserActivity
  ): Promise<UserActivityModel> {
    return this.userActivityModel.create(userActivity as any)
  }

  /**
   * Limit the number of attempts that users can make in
   * logging in, resetting passwords, and verifying email address.
   * Once the number of attempts allowed is exceeded,
   * users will be prohibited within 15 minutes.
   *
   * @param key - redis key
   * @param max - number of attempts allowed
   */
  async failRemaining(key: string, max: number): Promise<number> {
    const result = await this.redisService.get(key)
    const amount = parseNumber(result, 0)
    return max - amount
  }

  /**
   * Increase the number of user attempts
   *
   * @param key - redis key
   */
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

    const cache = await this.redisService.get(key)
    const remaining = options.max - parseNumber(cache, 0)

    if (remaining < 1) {
      throw new ForbiddenException('Limit exceeded. Please try again later.')
    }

    try {
      await checkFunc()
    } catch (err: unknown) {
      await this.redisService.multi([
        ['incr', key],
        ['expire', key, String(hs(options.expire))]
      ])
      throw err
    }
  }

  async getVerificationCode(
    key: string,
    length = 6,
    type = RandomType.NUMERIC
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
    const fields = Object.keys(result as Object)
    const count = fields.length

    if (count > VERIFICATION_CODE_LIMIT) {
      await this.redisService.hdel({
        key,
        field: fields.splice(0, count - VERIFICATION_CODE_LIMIT)
      })
    }

    return code
  }

  async checkVerificationCode(key: string, code: string): Promise<void> {
    const cache = await this.redisService.hget({
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

  /**
   * Create a team for every new user
   * Attached Free Plan to newly created team
   *
   * Refactor at 5 May 2022
   * Attach a 14 days free trial Business Plan to newly created team
   *
   * @Discard at 8 Sep 2022
   * User have to manually create workspace and choose whether to start free trial of Premium plan or not
   */
  // async createTeam(
  //   ownerId: string,
  //   email: string,
  //   userName: string
  // ): Promise<string> {
  //   const businessPlan = await this.planService.findWithPricesByGrade(
  //     PlanGradeEnum.BUSINESS
  //   )
  //
  //   const teamId = nanoid(8)
  //   const trialEnd = date().add(14, 'day').unix()
  //   const billingCycle = BillingCycleEnum.MONTHLY
  //
  //   const subscription = await this.paymentService.createFreeTrial({
  //     email,
  //     teamId,
  //     plan: businessPlan,
  //     trialEnd,
  //     billingCycle
  //   })
  //
  //   // Create team
  //   await this.teamService.create({
  //     _id: teamId,
  //     ownerId,
  //     name: `${userName}'s workspace`,
  //     storageQuota: 0,
  //     subscription: {
  //       id: subscription.id,
  //       planId: businessPlan.id,
  //       billingCycle,
  //       startAt: timestamp(),
  //       endAt: trialEnd,
  //       status: SubscriptionStatusEnum.ACTIVE
  //     }
  //   })
  //
  //   await this.teamService.createMember({
  //     teamId,
  //     memberId: ownerId,
  //     role: TeamRoleEnum.ADMIN
  //   })
  //
  //   return teamId
  // }

  async gt4Validate(
    input: GeeTestValidateOptions
  ): Promise<GeeTestValidateResponse> {
    const gt = new GeeTest({
      captchaId: GEETEST4_CAPTCHA_ID,
      captchaKey: GEETEST4_CAPTCHA_KEY
    })
    const res = await gt.validate(input)

    if (res.result !== 'success') {
      throw new BadRequestException(res.reason)
    }

    return res
  }
}
