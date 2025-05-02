import { SocialLoginTypeEnum } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
const { isValid } = helper
import { Controller, Get, Param, Post, Query, Req, Res } from '@nestjs/common'
import {
  AuthService,
  RedisService,
  SocialLoginService,
  UserService
} from '@service'
import { Logger } from '@utils'

@Controller()
export class SocialLoginController {
  private readonly logger: Logger

  constructor(
    private readonly socialLoginService: SocialLoginService,
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
    private readonly userService: UserService
  ) {
    this.logger = new Logger(SocialLoginController.name)
  }

  /**
   * Sign With Apple will post the code to back server,
   * this value cannot be obtained in front end.
   * We have to use back end server to deal with the problem here,
   * and front end need to attach the deviceId to the authorized url.
   *
   * Example:
   * http://my.heyformhq.com/connect/google?state=DMbcJqLJ
   */
  @Get('/connect/:kind')
  async authUrl(
    @Param('kind') kind: string,
    @Query() query: Record<string, string>,
    @Res() res: any
  ) {
    if (helper.isEmpty(query.state)) {
      return res.render('index', {
        rendererData: {
          error: `unable_connect_${kind}`.toUpperCase()
        }
      })
    }

    const authUrl = this.socialLoginService.authUrl(kind as any, query.state)

    // Store redirect_uri to redis
    if (isValid(query.redirect_uri)) {
      const key = `redirect_uri:${query.state}`

      await this.redisService.set({
        key,
        value: query.redirect_uri,
        duration: '1m'
      })
    }

    if (helper.isEmpty(authUrl)) {
      return res.render('index', {
        rendererData: {
          error: `unable_connect_${kind}`.toUpperCase()
        }
      })
    }

    res.redirect(302, authUrl)
  }

  @Get('/connect/:kind/callback')
  async authGetCallback(
    @Param('kind') kind: SocialLoginTypeEnum,
    @Query() query: Record<string, string>,
    @Req() req: any,
    @Res() res: any
  ) {
    await this.handleCallback(kind, query, req, res)
  }

  @Post('/connect/:kind/callback')
  async authPostCallback(
    @Param('kind') kind: SocialLoginTypeEnum,
    @Req() req: any,
    @Res() res: any
  ) {
    //!!! Sign With Apple will only post `code` and `state` to back-end server
    await this.handleCallback(kind, req.body, req, res)
  }

  private async handleCallback(
    kind: SocialLoginTypeEnum,
    query: Record<string, string>,
    req: any,
    res: any
  ) {
    try {
      const userId = await this.socialLoginService.authCallback(
        req,
        kind,
        query.code || query.credential
      )

      await this.authService.login({
        res,
        userId,
        deviceId: query.state
      })

      const user = await this.userService.findById(userId)
      const baseUri = !user.isOnboardRequired ? '/' : '/onboarding'

      const key = `redirect_uri:${query.state}`
      let redirectUri = await this.redisService.get(key)

      if (isValid(redirectUri)) {
        redirectUri = `${baseUri}?redirect_uri=${encodeURIComponent(
          redirectUri
        )}`
      } else {
        redirectUri = baseUri
      }

      res.render('social-login', {
        redirectUri
      })
    } catch (err) {
      this.logger.error(err)

      res.render('index', {
        rendererData: {
          error: `unable_connect_${kind}`.toUpperCase()
        }
      })
    }
  }
}
