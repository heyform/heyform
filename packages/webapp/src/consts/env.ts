import { helper } from '@heyform-inc/utils'

export const DEVICEID_COOKIE_NAME = 'HEYFORM_USER_ID'
export const LOGGED_COOKIE_NAME = 'HEYFORM_LOGGED_IN'
export const LOCALE_COOKIE_NAME = 'HEYFORM_LOCALE'
export const REDIRECT_COOKIE_NAME = 'HEYFORM_REDIRECT'

export const HOMEPAGE_URL =
  window.heyform?.homepageURL || (import.meta.env.VITE_DASHBOARD_URL as string)
export const DASHBOARD_URL = HOMEPAGE_URL
export const WEBSITE_URL =
  window.heyform?.websiteURL || (import.meta.env.VITE_HOMEPAGE_URL as string)

export const GRAPHQL_API_URL = import.meta.env.VITE_GRAPHQL_API_URL as string
export const CDN_UPLOAD_URL = import.meta.env.VITE_CDN_UPLOAD_URL as string

export const COOKIE_DOMAIN =
  window.heyform?.cookieDomain || (import.meta.env.VITE_COOKIE_DOMAIN as string)

export const STRIPE_PUBLISHABLE_KEY =
  window.heyform?.stripePublishableKey || (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)
export const GEETEST_CAPTCHA_ID =
  window.heyform?.geetestCaptchaId || (import.meta.env.VITE_GEETEST_CAPTCHA_ID as string)
export const GOOGLE_RECAPTCHA_KEY =
  window.heyform?.googleRecaptchaKey || (import.meta.env.VITE_GOOGLE_RECAPTCHA_KEY as string)

export const DISABLE_LOGIN_WITH_GOOGLE = helper.isTrue(
  window.heyform?.disableLoginWithGoogle || import.meta.env.VITE_DISABLE_LOGIN_WITH_GOOGLE
)
export const DISABLE_LOGIN_WITH_APPLE = helper.isTrue(
  window.heyform?.disableLoginWithApple || import.meta.env.VITE_DISABLE_LOGIN_WITH_APPLE
)
export const VERIFY_USER_EMAIL = helper.isTrue(
  window.heyform?.verifyUserEmail || import.meta.env.VITE_VERIFY_USER_EMAIL
)
export const APP_DISABLE_REGISTRATION = helper.isTrue(
  window.heyform?.appDisableRegistration || import.meta.env.VITE_APP_DISABLE_REGISTRATION
)

export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string

export const CUSTOM_DOMAIN_CNAME_VALUE = import.meta.env.VITE_CUSTOM_DOMAIN_CNAME_VALUE as string
export const CUSTOM_DOMAIN_ANAME_VALUE = import.meta.env.VITE_CUSTOM_DOMAIN_ANAME_VALUE as string

export const TEMPLATES_URL = import.meta.env.VITE_TEMPLATES_URL as string
export const HELP_CENTER_URL = import.meta.env.VITE_HELP_CENTER_URL as string

export const ONBOARDING_FORM_URL = import.meta.env.VITE_ONBOARDING_FORM_URL as string || HOMEPAGE_URL

export const IS_PROD = import.meta.env.NODE_ENV === 'production'
export const PACKAGE_VERSION = import.meta.env.PACKAGE_VERSION

export const COOKIE_OPTIONS: AnyMap = {
  expires: 365,
  sameSite: 'strict',
  domain: COOKIE_DOMAIN,
  secure: IS_PROD
}
