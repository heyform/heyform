import { Controller, Get, Header, Res } from '@nestjs/common'
import { Response } from 'express'

import {
  APP_DISABLE_REGISTRATION,
  APP_HOMEPAGE_URL,
  COOKIE_DOMAIN,
  DISABLE_LOGIN_WITH_APPLE,
  DISABLE_LOGIN_WITH_GOOGLE,
  GEETEST_CAPTCHA_ID,
  GOOGLE_RECAPTCHA_KEY,
  STRIPE_PUBLISHABLE_KEY,
  VERIFY_USER_EMAIL
} from '@environments'

@Controller()
export class DashboardController {
  @Get('/*')
  @Header('X-Frame-Options', 'SAMEORIGIN')
  index(@Res() res: Response) {
    return res.render('index', {
      rendererData: {
        homepageURL: APP_HOMEPAGE_URL,
        cookieDomain: COOKIE_DOMAIN,
        stripePublishableKey: STRIPE_PUBLISHABLE_KEY,
        geetestCaptchaId: GEETEST_CAPTCHA_ID,
        googleRecaptchaKey: GOOGLE_RECAPTCHA_KEY,
        appDisableRegistration: APP_DISABLE_REGISTRATION,
        disableLoginWithApple: DISABLE_LOGIN_WITH_APPLE,
        disableLoginWithGoogle: DISABLE_LOGIN_WITH_GOOGLE,
        verifyUserEmail: VERIFY_USER_EMAIL
      }
    })
  }
}
