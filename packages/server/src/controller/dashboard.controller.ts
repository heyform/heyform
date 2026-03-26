import { Controller, Get, Header, Res } from '@nestjs/common'
import { Response } from 'express'

import {
  APP_DISABLE_EMAIL_LOGIN,
  APP_DISABLE_REGISTRATION,
  APP_HOMEPAGE_URL,
  COOKIE_DOMAIN,
  ENABLE_GOOGLE_FONTS,
  GOOGLE_RECAPTCHA_KEY,
  STRIPE_PUBLISHABLE_KEY,
  VERIFY_EMAIL_RESEND_COOLDOWN
} from '@environments'
import { hs } from '@heyform-inc/utils'

@Controller()
export class DashboardController {
  private runtimeConfig() {
    return {
      homepageURL: APP_HOMEPAGE_URL,
      websiteURL: APP_HOMEPAGE_URL,
      appDisableRegistration: APP_DISABLE_REGISTRATION,
      cookieDomain: COOKIE_DOMAIN,
      enableGoogleFonts: ENABLE_GOOGLE_FONTS,
      stripePublishableKey: STRIPE_PUBLISHABLE_KEY,
      googleRecaptchaKey: GOOGLE_RECAPTCHA_KEY,
      verifyEmailResendCooldownSeconds: Math.ceil(hs(VERIFY_EMAIL_RESEND_COOLDOWN) / 1000),
      disableEmailLogin: APP_DISABLE_EMAIL_LOGIN
    }
  }

  @Get('/api/config')
  config() {
    return this.runtimeConfig()
  }

  @Get('/sign-up')
  signUp(@Res() res: Response) {
    if (APP_DISABLE_REGISTRATION) {
      return res.redirect(302, '/login')
    }

    return this.index(res)
  }

  @Get([
    '/',
    '/dashboard',
    '/dashboard/*',
    '/login',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/oauth/authorize',
    '/workspace/create',
    '/workspace',
    '/workspace/*'
  ])
  @Header('X-Frame-Options', 'SAMEORIGIN')
  index(@Res() res: Response) {
    return res.render('index', {
      title: 'HeyForm Dashboard - Create and Manage Custom Forms Effortlessly',
      description:
        "Simplify your form creation process with HeyForm's intuitive dashboard. Design, customize, and manage forms all in one place, with no coding required.",
      heyform: this.runtimeConfig()
    })
  }
}
