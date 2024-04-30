import * as fs from 'fs'
import { resolve } from 'path'

import { loadEnv } from '@heyooo-inc/env'
import { bytes, commonFileMimeTypes, helper, mime, toBool } from '@heyform-inc/utils'

// environment
export const NODE_ENV: string = process.env.NODE_ENV || 'development'
export const ROOT_PATH = process.cwd()

// Load environment
loadEnv(NODE_ENV, ROOT_PATH)

// App serve
export const APP_LISTEN_PORT: number = +process.env.APP_LISTEN_PORT || 8000
export const APP_LISTEN_HOSTNAME: string = process.env.APP_LISTEN_HOSTNAME || '0.0.0.0'
export const APP_HOMEPAGE_URL: string =
  process.env.APP_HOMEPAGE_URL || `http://${APP_LISTEN_HOSTNAME}:${APP_LISTEN_PORT}`
export const APP_DISABLE_REGISTRATION: boolean = helper.isTrue(process.env.APP_DISABLE_REGISTRATION)

// Cookie
export const COOKIE_MAX_AGE: string = process.env.COOKIE_MAX_AGE || '1y'
export const COOKIE_DOMAIN: string = process.env.COOKIE_DOMAIN || new URL(APP_HOMEPAGE_URL).hostname
export const SESSION_KEY: string = process.env.SESSION_KEY
export const SESSION_MAX_AGE: string = process.env.SESSION_MAX_AGE || '15d'

// Email templates
export const EMAIL_TEMPLATES_DIR: string = resolve(ROOT_PATH, 'resources/email-templates')

// Static

export const STATIC_DIR: string = resolve(ROOT_PATH, 'static')
export const VIEW_DIR: string = resolve(ROOT_PATH, 'view')

// Upload
export const UPLOAD_FILE_TYPES: string[] = (process.env.UPLOAD_FILE_TYPES
  ? process.env.UPLOAD_FILE_TYPES.split(',').map(mime)
  : commonFileMimeTypes) as any
export const UPLOAD_FILE_SIZE: number = +process.env.UPLOAD_FILE_SIZE || bytes('10mb')
export const UPLOAD_DIR: string = resolve(STATIC_DIR, 'upload')

// Encryption
export const FORM_ENCRYPTION_KEY: string = process.env.FORM_ENCRYPTION_KEY

// Bcrypt
export const BCRYPT_SALT: number = +process.env.BCRYPT_SALT || 10

// Mongo
export const MONGO_URI: string = process.env.MONGO_URI
export const MONGO_USER: string = process.env.MONGO_USER
export const MONGO_PASSWORD: string = process.env.MONGO_PASSWORD
export const MONGO_SSL_CA_PATH: Buffer[] | undefined = process.env.MONGO_SSL_CA_PATH
  ? [fs.readFileSync(process.env.MONGO_SSL_CA_PATH)]
  : undefined

// Redis
export const REDIS_HOST: string = process.env.REDIS_HOST || '127.0.0.1'
export const REDIS_PORT: number = +process.env.REDIS_PORT || 6379
export const REDIS_PASSWORD: string = process.env.REDIS_PASSWORD
export const REDIS_DB: number = +process.env.REDIS_DB || 0

// SMTP
export const VERIFY_USER_EMAIL: boolean = toBool(process.env.VERIFY_USER_EMAIL, false)
export const SMTP_FROM: string = process.env.SMTP_FROM
export const SMTP_HOST: string = process.env.SMTP_HOST
export const SMTP_PORT: number = +process.env.SMTP_PORT
export const SMTP_USER: string = process.env.SMTP_USER
export const SMTP_PASSWORD: string = process.env.SMTP_PASSWORD
export const SMTP_SECURE: boolean = helper.isTrue(process.env.SMTP_SECURE)
export const SMTP_IGNORE_CERT: boolean = helper.isTrue(process.env.SMTP_IGNORE_CERT)

// Google recaptcha
export const GOOGLE_RECAPTCHA_KEY: string = process.env.GOOGLE_RECAPTCHA_KEY
export const GOOGLE_RECAPTCHA_SECRET: string = process.env.GOOGLE_RECAPTCHA_SECRET

// Geetest captcha
export const GEETEST_CAPTCHA_ID: string = process.env.GEETEST_CAPTCHA_ID
export const GEETEST_CAPTCHA_KEY: string = process.env.GEETEST_CAPTCHA_KEY

// Akismet
export const AKISMET_KEY: string = process.env.AKISMET_KEY

// Social login
export const APPLE_LOGIN_TEAM_ID: string = process.env.APPLE_LOGIN_TEAM_ID
export const APPLE_LOGIN_WEB_CLIENT_ID: string = process.env.APPLE_LOGIN_WEB_CLIENT_ID
export const APPLE_LOGIN_KEY_ID: string = process.env.APPLE_LOGIN_KEY_ID
export const APPLE_LOGIN_PRIVATE_KEY_PATH: Buffer | undefined = process.env
  .APPLE_LOGIN_PRIVATE_KEY_PATH
  ? fs.readFileSync(process.env.APPLE_LOGIN_PRIVATE_KEY_PATH as any)
  : undefined
export const DISABLE_LOGIN_WITH_APPLE =
  helper.isEmpty(APPLE_LOGIN_TEAM_ID) ||
  helper.isEmpty(APPLE_LOGIN_WEB_CLIENT_ID) ||
  helper.isEmpty(APPLE_LOGIN_KEY_ID) ||
  helper.isEmpty(APPLE_LOGIN_PRIVATE_KEY_PATH)

export const GOOGLE_LOGIN_CLIENT_ID: string = process.env.GOOGLE_LOGIN_CLIENT_ID
export const GOOGLE_LOGIN_CLIENT_SECRET: string = process.env.GOOGLE_LOGIN_CLIENT_SECRET
export const DISABLE_LOGIN_WITH_GOOGLE =
  helper.isEmpty(GOOGLE_LOGIN_CLIENT_ID) || helper.isEmpty(GOOGLE_LOGIN_CLIENT_SECRET)

// Stripe
export const STRIPE_VERSION: string = process.env.STRIPE_VERSION
export const STRIPE_PUBLISHABLE_KEY: string = process.env.STRIPE_PUBLISHABLE_KEY
export const STRIPE_SECRET_KEY: string = process.env.STRIPE_SECRET_KEY
export const STRIPE_CONNECT_CLIENT_ID: string = process.env.STRIPE_CONNECT_CLIENT_ID
export const STRIPE_WEBHOOK_SECRET_KEY: string = process.env.STRIPE_WEBHOOK_SECRET_KEY

// Bull
export const BULL_JOB_ATTEMPTS: number = +process.env.BULL_JOB_ATTEMPTS || 3
export const BULL_JOB_TIMEOUT: string = process.env.BULL_JOB_TIMEOUT || '1m'
export const BULL_JOB_BACKOFF_DELAY: number = +process.env.BULL_JOB_BACKOFF_DELAY || 3000
export const BULL_JOB_BACKOFF_TYPE: string = process.env.BULL_JOB_BACKOFF_TYPE || 'fixed'

// Time limit on team invite links
export const INVITE_CODE_EXPIRE_DAYS: number = +process.env.INVITE_CODE_EXPIRE_DAYS || 7

// Form report rate
export const FORM_REPORT_RATE: string = process.env.FORM_REPORT_RATE || '5s'

// Verification code
export const VERIFICATION_CODE_EXPIRE: string = process.env.VERIFICATION_CODE_EXPIRE || '10m'
export const VERIFICATION_CODE_LIMIT: number = +process.env.VERIFICATION_CODE_LIMIT || 5

// Account Deletion
export const ACCOUNT_DELETION_SCHEDULE_INTERVAL: string =
  process.env.ACCOUNT_DELETION_SCHEDULE_INTERVAL || '2d'

// Unsplash
export const UNSPLASH_CLIENT_ID: string = process.env.UNSPLASH_CLIENT_ID

// OpenAI
export const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY
export const OPENAI_GPT_MODEL = process.env.OPENAI_GPT_MODEL || 'gpt-3.5-turbo-0125'
