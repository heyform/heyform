import * as nodemailer from 'nodemailer'

export interface SmtpOptions {
  host: string
  port: number
  user: string
  password: string
  pool: boolean
  logger: any
}

export interface SmtpMessage {
  from: string
  to: string
  subject: string
  html: string
}

export async function smtpSendMail(
  options: SmtpOptions,
  message: SmtpMessage
): Promise<string | unknown> {
  const transport = nodemailer.createTransport({
    host: options.host,
    port: options.port,
    auth: {
      user: options.user,
      pass: options.password
    },
    pool: options.pool,
    logger: options.logger
  } as any)

  const result = await transport.sendMail(message)
  return result.messageId
}
