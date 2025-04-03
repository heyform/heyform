import {
  bytes,
  commonFileMimeTypes,
  commonImageMimeTypes,
  mime
} from '@heyform-inc/utils'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as process from 'process'

dotenv.config()

// environment
export const NODE_ENV: string = process.env.NODE_ENV || 'development'

// application
export const APP_LISTEN_PORT: number = +process.env.APP_LISTEN_PORT || 8080
export const APP_LISTEN_HOSTNAME: string =
  process.env.APP_LISTEN_HOSTNAME || '127.0.0.1'
export const APP_HOMEPAGE: string = process.env.APP_HOMEPAGE

// cookie
export const COOKIE_MAX_AGE: string = process.env.COOKIE_MAX_AGE || '1y'
export const COOKIE_DOMAIN: string = process.env.COOKIE_DOMAIN
export const SESSION_KEYS: string[] = [process.env.KEY1]
export const SESSION_MAX_AGE: string = process.env.SESSION_MAX_AGE || '15d'

// upload
export const UPLOAD_IMAGE_TYPE: string[] = (process.env.UPLOAD_IMAGE_TYPE
  ? process.env.UPLOAD_IMAGE_TYPE.split(',').map(mime)
  : commonImageMimeTypes) as any
export const UPLOAD_IMAGE_SIZE: number =
  +process.env.UPLOAD_IMAGE_SIZE || bytes('2mb')
export const UPLOAD_FILE_TYPE: string[] = (process.env.UPLOAD_FILE_TYPE
  ? process.env.UPLOAD_FILE_TYPE.split(',').map(mime)
  : commonFileMimeTypes) as any
export const UPLOAD_FILE_SIZE: number =
  +process.env.UPLOAD_FILE_SIZE || bytes('10mb')

// static
export const STATIC: string = process.env.STATIC || 'static'

// encryption
export const ENCRYPTION_KEY: string = process.env.KEY2

// bcrypt
export const BCRYPT_SALT: number = +process.env.BCRYPT_SALT || 10

// mongo
export const MONGO_URI: string = process.env.MONGO_URI
export const MONGO_USER: string = process.env.MONGO_USER
export const MONGO_PASSWORD: string = process.env.MONGO_PASSWORD
export const MONGO_SSL_CA: Buffer[] | undefined = process.env.MONGO_SSL_CA
  ? [fs.readFileSync(process.env.MONGO_SSL_CA)]
  : undefined

// redis
export const REDIS_HOST: string = process.env.REDIS_HOST || '127.0.0.1'
export const REDIS_PORT: number = +process.env.REDIS_PORT || 6379
export const REDIS_PASSWORD: string = process.env.REDIS_PASSWORD
export const REDIS_DB: number = +process.env.REDIS_DB || 0

// smtp
export const SMTP_FROM: string = process.env.SMTP_FROM
export const SMTP_HOST: string = process.env.SMTP_HOST
export const SMTP_PORT: number = +process.env.SMTP_PORT
export const SMTP_USER: string = process.env.SMTP_USER
export const SMTP_PASSWORD: string = process.env.SMTP_PASSWORD

// google recaptcha
export const GOOGLE_RECAPTCHA_KEY: string = process.env.GOOGLE_RECAPTCHA_KEY
export const GOOGLE_RECAPTCHA_SECRET: string =
  process.env.GOOGLE_RECAPTCHA_SECRET

// geetest captcha
export const GEETEST_CAPTCHA_KEY: string = process.env.GEETEST_CAPTCHA_KEY
export const GEETEST_CAPTCHA_SECRET: string = process.env.GEETEST_CAPTCHA_SECRET

// geetest captcha 4
export const GEETEST4_CAPTCHA_ID: string = process.env.GEETEST4_CAPTCHA_ID
export const GEETEST4_CAPTCHA_KEY: string = process.env.GEETEST4_CAPTCHA_KEY

// akismet
export const AKISMET_KEY: string = process.env.AKISMET_KEY

// social login
export const APPLE_LOGIN_TEAM_ID: string = process.env.APPLE_LOGIN_TEAM_ID
export const APPLE_LOGIN_WEB_CLIENT_ID: string =
  process.env.APPLE_LOGIN_WEB_CLIENT_ID
export const APPLE_LOGIN_KEY_ID: string = process.env.APPLE_LOGIN_KEY_ID
export const APPLE_LOGIN_PRIVATE_KEY: Buffer | undefined = process.env.APPLE_LOGIN_PRIVATE_KEY
  ? fs.readFileSync(process.env.APPLE_LOGIN_PRIVATE_KEY)
  : undefined
export const GOOGLE_LOGIN_CLIENT_ID: string = process.env.GOOGLE_LOGIN_CLIENT_ID
export const GOOGLE_LOGIN_CLIENT_SECRET: string =
  process.env.GOOGLE_LOGIN_CLIENT_SECRET

// stripe
export const STRIPE_VERSION: string = process.env.STRIPE_VERSION
export const STRIPE_PUBLISHABLE_KEY: string = process.env.STRIPE_PUBLISHABLE_KEY
export const STRIPE_SECRET_KEY: string = process.env.STRIPE_SECRET_KEY
export const STRIPE_SUBSCRIPTION_SECRET_KEY: string =
  process.env.STRIPE_SUBSCRIPTION_SECRET_KEY
export const STRIPE_CONNECT_CLIENT_ID: string =
  process.env.STRIPE_CONNECT_CLIENT_ID
export const STRIPE_CONNECT_SECRET_KEY: string =
  process.env.STRIPE_CONNECT_SECRET_KEY

// bull
export const BULL_JOB_ATTEMPTS: number = +process.env.BULL_JOB_ATTEMPTS || 3
export const BULL_JOB_TIMEOUT: string = process.env.BULL_JOB_TIMEOUT || '1m'
export const BULL_JOB_BACKOFF_DELAY: number =
  +process.env.BULL_JOB_BACKOFF_DELAY || 3000
export const BULL_JOB_BACKOFF_TYPE: string =
  process.env.BULL_JOB_BACKOFF_TYPE || 'fixed'

// Time limit on team invite links
export const INVITE_CODE_EXPIRE_DAYS: number =
  +process.env.INVITE_CODE_EXPIRE_DAYS || 7

// Time limit on team submission quote
export const SUBMISSION_QUOTE_RESET_DAYS: number =
  +process.env.SUBMISSION_QUOTE_RESET_DAYS || 30

// Sentry
export const SENTRY_IO_DSN: string = process.env.SENTRY_IO_DSN

// Open App
export const OPEN_APP_ACCESS_EXPIRES: string =
  process.env.OPEN_APP_ACCESS_EXPIRES || '15d'
export const OPEN_APP_REFRESH_EXPIRES: string =
  process.env.OPEN_APP_REFRESH_EXPIRES || '60d'

// Form report rate
export const FORM_REPORT_RATE: string = process.env.FORM_REPORT_RATE || '5s'

// Verification code
export const VERIFICATION_CODE_EXPIRE: string =
  process.env.VERIFICATION_CODE_EXPIRE || '10m'
export const VERIFICATION_CODE_LIMIT: number =
  +process.env.VERIFICATION_CODE_LIMIT || 3

// Account Deletion
export const ACCOUNT_DELETION_SCHEDULE_INTERVAL: string =
  process.env.ACCOUNT_DELETION_SCHEDULE_INTERVAL || '2d'

// Unsplash
export const UNSPLASH_CLIENT_ID: string = process.env.UNSPLASH_CLIENT_ID

// EspoCRM
export const ESPOCRM_API_URL: string = process.env.ESPOCRM_API_URL
export const ESPOCRM_API_KEY: string = process.env.ESPOCRM_API_KEY

// Free trial
export const FREE_TRIAL_DAYS: number = +process.env.FREE_TRIAL_DAYS || 7

// OpenAI
export const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY
export const OPENAI_GPT_MODEL = process.env.OPENAI_GPT_MODEL || 'gpt-4o'
