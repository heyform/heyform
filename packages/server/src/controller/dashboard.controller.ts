import { Controller, Get, Header, Res } from '@nestjs/common'
import { Response } from 'express'

import {
  APP_HOMEPAGE,
  COOKIE_DOMAIN,
  STRIPE_PUBLISHABLE_KEY,
  GEETEST_CAPTCHA_KEY,
  GOOGLE_RECAPTCHA_KEY
} from '@environments'

@Controller()
export class DashboardController {
  // @Get('/*')
  @Get(['/', '/dashboard', '/dashboard/*'])
  @Header('X-Frame-Options', 'SAMEORIGIN')
  index(@Res() res: Response) {
    return res.render('index', {
      title: 'HeyForm Dashboard - Create and Manage Custom Forms Effortlessly',
      description:
        "Simplify your form creation process with HeyForm's intuitive dashboard. Design, customize, and manage forms all in one place, with no coding required.",
      rendererData: {
        homepageURL: APP_HOMEPAGE,
        websiteURL: APP_HOMEPAGE,
        cookieDomain: COOKIE_DOMAIN,
        stripePublishableKey: STRIPE_PUBLISHABLE_KEY,
        geetestCaptchaId: GEETEST_CAPTCHA_KEY,
        googleRecaptchaKey: GOOGLE_RECAPTCHA_KEY
      }
    })
  }
}
