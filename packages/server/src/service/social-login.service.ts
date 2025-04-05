import {
  APP_HOMEPAGE,
  APPLE_LOGIN_KEY_ID,
  APPLE_LOGIN_PRIVATE_KEY,
  APPLE_LOGIN_TEAM_ID,
  APPLE_LOGIN_WEB_CLIENT_ID,
  GOOGLE_LOGIN_CLIENT_ID,
  GOOGLE_LOGIN_CLIENT_SECRET
} from '@environments'
import { GoogleOAuth } from '@heyforms/integrations'
import {
  appleLoginUrl,
  appleUserInfo,
  googleLoginUrl,
  googleUserInfo
} from '@heyforms/nestjs'
import { UserInfo } from '@heyforms/nestjs'
import { SocialLoginTypeEnum } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { UserSocialAccountModel } from '@model'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { QueueService } from './queue.service'
import { UserService } from './user.service'
import { COOKIE_UTM_SOURCE_NAME } from '@config'
import { EspoCRMAction } from '@utils'

const appleOptions = {
  webClientId: APPLE_LOGIN_WEB_CLIENT_ID,
  teamId: APPLE_LOGIN_TEAM_ID,
  keyId: APPLE_LOGIN_KEY_ID,
  privateKey: APPLE_LOGIN_PRIVATE_KEY
}

const googleOptions = {
  clientId: GOOGLE_LOGIN_CLIENT_ID,
  clientSecret: GOOGLE_LOGIN_CLIENT_SECRET
}

@Injectable()
export class SocialLoginService {
  constructor(
    @InjectModel(UserSocialAccountModel.name)
    private readonly userSocialAccountModel: Model<UserSocialAccountModel>,
    private readonly userService: UserService,
    private readonly queueService: QueueService
  ) {}

  private static callbackUrl(kind: SocialLoginTypeEnum): string {
    return `${APP_HOMEPAGE}/connect/${kind}/callback`
  }

  public authUrl(kind: SocialLoginTypeEnum, state: string): string {
    const redirectUrl = SocialLoginService.callbackUrl(kind)

    switch (kind) {
      case SocialLoginTypeEnum.APPLE:
        return appleLoginUrl({
          ...appleOptions,
          redirectUrl,
          state
        } as any)

      case SocialLoginTypeEnum.GOOGLE:
        return googleLoginUrl({
          ...googleOptions,
          redirectUrl,
          state
        })
    }
  }

  public async userInfo(kind: string, code: string): Promise<UserInfo> {
    const redirectUrl = SocialLoginService.callbackUrl(
      kind as SocialLoginTypeEnum
    )

    if (kind === SocialLoginTypeEnum.GOOGLE_ONE_TAP) {
      const googleOAuth = new GoogleOAuth({
        ...googleOptions,
        redirectUri: redirectUrl
      })
      return (await googleOAuth.verifyIdToken(code)) as any
    }

    switch (kind) {
      case SocialLoginTypeEnum.APPLE:
        return await appleUserInfo(code, {
          ...appleOptions,
          redirectUrl
        } as any)

      case SocialLoginTypeEnum.GOOGLE:
        return await googleUserInfo(code, {
          ...googleOptions,
          redirectUrl
        })
    }
  }

  async findByOpenId(
    kind: SocialLoginTypeEnum,
    openId: string
  ): Promise<UserSocialAccountModel | null> {
    return this.userSocialAccountModel.findOne({
      kind,
      openId
    })
  }

  public async deleteByUserId(userId: string): Promise<boolean> {
    const result = await this.userSocialAccountModel.deleteOne({
      userId
    })
    return result?.n > 0
  }

  async create(
    data: UserSocialAccountModel | any
  ): Promise<string | undefined> {
    const result = await this.userSocialAccountModel.create(data)
    return result.id
  }

  async findByUserId(userId: string): Promise<UserSocialAccountModel | null> {
    return this.userSocialAccountModel.findOne({
      userId
    })
  }

  async authCallback(
    req: any,
    kind: SocialLoginTypeEnum,
    code: string
  ): Promise<string> {
    const userInfo = await this.userInfo(kind, code)

    if (helper.isEmpty(userInfo)) {
      throw new BadRequestException('Invalid social media user information')
    }

    // Check if user social account exists
    let userId: string | undefined

    if (kind === SocialLoginTypeEnum.GOOGLE_ONE_TAP) {
      kind = SocialLoginTypeEnum.GOOGLE
    }

    const account = await this.findByOpenId(kind, userInfo.openId)

    if (account) {
      userId = account.userId
    } else {
      // Check if user exists
      if (userInfo!.user.email) {
        const existUser = await this.userService.findByEmail(
          userInfo!.user.email
        )

        if (existUser) {
          userId = existUser.id
        }
      }

      // Create new user
      if (!userId) {
        if (userInfo!.user.email) {
          // @ts-ignore
          userInfo!.user.isEmailVerified = true
        }

        // Create new user
        userId = await this.userService.create({
          ...userInfo!.user,
          // Add at 31 Aug 2024
          isOnboardRequired: true,
          onboardedAt: 0
        })

        // @discard
        // @Refactor at 17 Jan 2022
        //
        // @Refactor at 5 May 2022
        // Attach a 14 days free trial Business Plan to newly created team
        //
        // @Discard at 8 Sep 2022
        // User have to manually create workspace and choose whether to start free trial of Premium plan or not
        //
        // const teamId = await this.authService.createTeam(
        //   userId,
        //   userInfo!.user.email,
        //   userInfo!.user.name
        // )
        // await this.projectService.createByNewTeam(
        //   teamId,
        //   userId,
        //   userInfo!.user.name
        // )

        // Send welcome email
        if (userInfo!.user.email) {
          // Add to sendy
          this.queueService.addSendyQueue(userInfo!.user.email)

          // Report to lark
          this.userService.report(userInfo!.user.email)

          const source = req.cookies[COOKIE_UTM_SOURCE_NAME]

          // Add to espocrm
          this.queueService.addEspoCRMQueue({
            action: EspoCRMAction.CREATE_LEAD,
            userId,
            lead: {
              emailAddress: userInfo!.user.email,
              name: `${userInfo!.user.firstName} ${userInfo!.user.lastName}`,
              source
            }
          })
        }
      }

      // Bind user social-login relationship
      await this.create({
        kind,
        openId: userInfo!.openId,
        userId: userId!
      })
    }

    return userId
  }
}
