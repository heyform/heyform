export const DEVICEID_COOKIE_NAME = 'HEYFORM_USER_ID'
export const LOGGED_COOKIE_NAME = 'HEYFORM_LOGGED_IN'
export const LOCALE_COOKIE_NAME = 'HEYFORM_LOCALE'
export const REDIRECT_COOKIE_NAME = 'HEYFORM_REDIRECT'

export const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL as string
export const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL as string

export const GRAPHQL_API_URL = import.meta.env.VITE_GRAPHQL_API_URL as string
export const CDN_UPLOAD_URL = import.meta.env.VITE_CDN_UPLOAD_URL as string

export const COOKIE_DOMAIN = import.meta.env.VITE_COOKIE_DOMAIN as string

export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string

export const CUSTOM_DOMAIN_CNAME_VALUE = import.meta.env.VITE_CUSTOM_DOMAIN_CNAME_VALUE as string
export const CUSTOM_DOMAIN_ANAME_VALUE = import.meta.env.VITE_CUSTOM_DOMAIN_ANAME_VALUE as string

export const TEMPLATES_URL = import.meta.env.VITE_TEMPLATES_URL as string
export const HELP_CENTER_URL = import.meta.env.VITE_HELP_CENTER_URL as string

export const ONBOARDING_FORM_URL = import.meta.env.VITE_ONBOARDING_FORM_URL as string

export const IS_PROD = import.meta.env.NODE_ENV === 'production'
export const PACKAGE_VERSION = import.meta.env.PACKAGE_VERSION

export const COOKIE_OPTIONS: AnyMap = {
  expires: 365,
  sameSite: 'strict',
  domain: COOKIE_DOMAIN,
  secure: IS_PROD
}
