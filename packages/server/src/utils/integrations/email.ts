/**
 * @program: heyform-integrations
 * @description: Email
 * @author: Mufeng
 * @date: 2021-06-11 11:01
 **/

import * as nodemailer from 'nodemailer'
import { Transporter } from 'nodemailer'
import { SentMessageInfo } from 'nodemailer/lib/smtp-transport'

export interface EmailConfig {
  host: string
  port: number
  user: string
  password: string
  pool?: boolean
  logger?: any
}

export class Email {
  private readonly transport!: Transporter<SentMessageInfo>

  constructor(config: EmailConfig) {
    this.transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      auth: {
        user: config.user,
        pass: config.password
      },
      pool: config.pool,
      logger: config.logger
    } as any)
  }

  static init(config: EmailConfig): Email {
    return new Email(config)
  }

  async send(
    from: string,
    to: string,
    subject: string,
    html: string
  ): Promise<SentMessageInfo> {
    return this.transport.sendMail({
      from,
      to,
      subject,
      html
    })
  }
}
