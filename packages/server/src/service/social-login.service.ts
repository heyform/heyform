import { SocialLoginTypeEnum } from '@heyform-inc/shared-types-enums'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { UserService } from './user.service'
import {
  APPLE_LOGIN_KEY_ID,
  APPLE_LOGIN_PRIVATE_KEY_PATH,
  APPLE_LOGIN_TEAM_ID,
  APPLE_LOGIN_WEB_CLIENT_ID,
  APP_DISABLE_REGISTRATION,
  APP_HOMEPAGE_URL,
  DISABLE_LOGIN_WITH_OIDC,
  GOOGLE_LOGIN_CLIENT_ID,
  GOOGLE_LOGIN_CLIENT_SECRET,
  OIDC_ALLOW_PROVISIONING,
  OIDC_CLIENT_AUTH_METHOD,
  OIDC_CLIENT_ID,
  OIDC_CLIENT_SECRET,
  OIDC_ISSUER
} from '@environments'
import { helper } from '@heyform-inc/utils'
import { UserSocialAccountModel } from '@model'
import {
  OIDC_LOGIN_KIND,
  OidcAuthorizationRequest,
  OidcSocialLogin,
  UserInfo,
  appleLoginUrl,
  appleUserInfo,
  googleLoginUrl,
  googleUserInfo
} from '@utils'

export type SocialLoginKind = SocialLoginTypeEnum | typeof OIDC_LOGIN_KIND

export interface SocialLoginAuthorization {
  url: string
  transaction?: OidcAuthorizationRequest['transaction']
}

export interface SocialLoginCallbackContext {
  callbackParams: Record<string, unknown>
  state: string
  transaction?: OidcAuthorizationRequest['transaction']
}

const appleOptions = {
  webClientId: APPLE_LOGIN_WEB_CLIENT_ID,
  teamId: APPLE_LOGIN_TEAM_ID,
  keyId: APPLE_LOGIN_KEY_ID,
  privateKey: APPLE_LOGIN_PRIVATE_KEY_PATH
}

const googleOptions = {
  clientId: GOOGLE_LOGIN_CLIENT_ID,
  clientSecret: GOOGLE_LOGIN_CLIENT_SECRET
}

const oidcClient = new OidcSocialLogin({
  clientId: OIDC_CLIENT_ID,
  clientSecret: OIDC_CLIENT_SECRET,
  clientAuthMethod: OIDC_CLIENT_AUTH_METHOD,
  issuer: OIDC_ISSUER,
  redirectUrl: `${APP_HOMEPAGE_URL}/connect/${OIDC_LOGIN_KIND}/callback`
})

@Injectable()
export class SocialLoginService {
  constructor(
    @InjectModel(UserSocialAccountModel.name)
    private readonly userSocialAccountModel: Model<UserSocialAccountModel>,
    private readonly userService: UserService
  ) {}

  private static callbackUrl(kind: SocialLoginKind): string {
    return `${APP_HOMEPAGE_URL}/connect/${kind}/callback`
  }

  public async authUrl(
    kind: SocialLoginKind,
    state: string
  ): Promise<SocialLoginAuthorization | undefined> {
    const redirectUrl = SocialLoginService.callbackUrl(kind)

    switch (kind) {
      case SocialLoginTypeEnum.APPLE:
        return {
          url: appleLoginUrl({
            ...appleOptions,
            redirectUrl,
            state
          } as any)
        }

      case SocialLoginTypeEnum.GOOGLE:
        return {
          url: googleLoginUrl({
            ...googleOptions,
            redirectUrl,
            state
          })
        }

      case OIDC_LOGIN_KIND:
        if (DISABLE_LOGIN_WITH_OIDC) {
          throw new BadRequestException('OIDC login is not configured')
        }

        return oidcClient.getAuthRequest(state)
    }
  }

  public async userInfo(
    kind: SocialLoginKind,
    code: string,
    context?: SocialLoginCallbackContext
  ): Promise<UserInfo> {
    const redirectUrl = SocialLoginService.callbackUrl(kind)

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

      case OIDC_LOGIN_KIND:
        if (DISABLE_LOGIN_WITH_OIDC || !context?.transaction) {
          throw new BadRequestException('Invalid OIDC login transaction')
        }

        return oidcClient.getUserInfo(context.callbackParams, context.state, context.transaction)
    }
  }

  async findByOpenId(
    kind: SocialLoginKind,
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
    return (result.deletedCount ?? 0) > 0
  }

  async create(data: UserSocialAccountModel | any): Promise<string | undefined> {
    const result = await this.userSocialAccountModel.create(data)
    return result.id
  }

  async findByUserId(userId: string): Promise<UserSocialAccountModel | null> {
    return this.userSocialAccountModel.findOne({
      userId
    })
  }

  async authCallback(
    kind: SocialLoginKind,
    code: string,
    context?: SocialLoginCallbackContext
  ): Promise<string> {
    const userInfo = await this.userInfo(kind, code, context)

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
      const isOidc = kind === OIDC_LOGIN_KIND
      const hasVerifiedEmail = Boolean(userInfo.user.email) && userInfo.emailVerified === true

      if (!hasVerifiedEmail) {
        throw new BadRequestException('Social login provider must return a verified email address')
      }

      // Check if user exists
      if (userInfo.user.email) {
        const existUser = await this.userService.findByEmail(userInfo.user.email)

        if (existUser) {
          userId = existUser.id

          if (!existUser.isEmailVerified) {
            await this.userService.update(existUser.id, {
              isEmailVerified: true
            })
          }
        }
      }

      // Create new user
      if (!userId) {
        if (APP_DISABLE_REGISTRATION && !(isOidc && OIDC_ALLOW_PROVISIONING)) {
          throw new BadRequestException('Error: Registration is disabled')
        }

        // @ts-ignore
        userInfo.user.isEmailVerified = true

        // Create new user
        userId = await this.userService.create(userInfo.user)
      }

      await this.create({
        kind,
        openId: userInfo.openId,
        userId: userId!
      })
    }

    return userId
  }
}
