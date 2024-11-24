import {
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_USER,
  SMTP_SECURE,
  SMTP_IGNORE_CERT,
  SMTP_SERVERNAME
} from '@environments'
import { SmtpOptions } from '@utils'

export const SmtpOptionsFactory = (): SmtpOptions => ({
  host: SMTP_HOST,
  port: SMTP_PORT,
  user: SMTP_USER,
  password: SMTP_PASSWORD,
  secure: SMTP_SECURE,
  servername: SMTP_SERVERNAME,
  ignoreCert: SMTP_IGNORE_CERT,
  pool: true,
  logger: false
})
