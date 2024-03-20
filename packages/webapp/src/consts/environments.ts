export const HOMEPAGE_URL = window.heyform?.homepageURL || import.meta.env.VITE_HOMEPAGE_URL
export const GRAPHQL_URL = window.heyform?.graphqlURL || import.meta.env.VITE_GRAPHQL_URL
export const COOKIE_DOMAIN = window.heyform?.cookieDomain || import.meta.env.VITE_COOKIE_DOMAIN
export const STRIPE_PUBLISHABLE_KEY =
  window.heyform?.stripePublishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
export const GEETEST_CAPTCHA_ID =
  window.heyform?.geetestCaptchaId || import.meta.env.VITE_GEETEST_CAPTCHA_ID
export const GOOGLE_RECAPTCHA_KEY =
  window.heyform?.googleRecaptchaKey || import.meta.env.VITE_GOOGLE_RECAPTCHA_KEY
