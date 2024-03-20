import { SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER } from '@environments'
import { SmtpOptions } from '@utils'

export const SmtpOptionsFactory = (): SmtpOptions => ({
  host: SMTP_HOST,
  port: SMTP_PORT,
  user: SMTP_USER,
  password: SMTP_PASSWORD,
  pool: true,
  logger: false
})
