import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { JobOptions, Queue } from 'bull'
import { Dirent, readFileSync, readdirSync } from 'fs'
import { basename, extname, join } from 'path'

import { EMAIL_TEMPLATES_DIR, SMTP_FROM } from '@environments'
import { helper } from '@heyform-inc/utils'

interface JoinWorkspaceAlertOptions {
  teamName: string
  userName: string
}

interface ProjectDeletionAlertOptions {
  projectName: string
  teamName: string
  userName: string
}

interface ProjectDeletionRequestOptions {
  projectName: string
  teamName: string
  code: string
}

interface SubmissionNotificationOptions {
  formName: string
  submission: string
  link: string
}

interface TeamDeletionAlertOptions {
  teamName: string
  userName: string
}

interface TeamDeletionRequestOptions {
  teamName: string
  code: string
}

interface TeamInvitationOptions {
  userName: string
  teamName: string
  link: string
}

interface UserSecurityAlertOptions {
  deviceModel: string
  ip: string
  loginAt: string
}

const HTML_EXT = '.html'
const TEMPLATE_META_REGEX = /^---([\s\S]*?)---[\n\s\S]\n/
const DEFAULT_LOCALE = 'en'

@Injectable()
export class MailService {
  private readonly emailTemplates: Record<
    string,
    Record<string, { subject: string; html: string }>
  > = {}

  constructor(@InjectQueue('MailQueue') private readonly mailQueue: Queue) {
    this.init()
  }

  async accountDeletionAlert(to: string, locale?: string) {
    await this.addQueue('account_deletion_alert', to, undefined, undefined, locale)
  }

  async accountDeletionRequest(to: string, code: string, locale?: string) {
    await this.addQueue(
      'account_deletion_request',
      to,
      {
        code
      },
      undefined,
      locale
    )
  }

  async emailVerificationRequest(to: string, code: string, locale?: string) {
    await this.addQueue(
      'email_verification_request',
      to,
      {
        code
      },
      undefined,
      locale
    )
  }

  async formInvitation(to: string, link: string) {
    await this.addQueue('form_invitation', to, {
      link
    })
  }

  async joinWorkspaceAlert(to: string, options: JoinWorkspaceAlertOptions) {
    await this.addQueue('join_workspace_alert', to, options)
  }

  async passwordChangeAlert(to: string, locale?: string) {
    await this.addQueue('password_change_alert', to, undefined, undefined, locale)
  }

  async projectDeletionAlert(to: string, options: ProjectDeletionAlertOptions, locale?: string) {
    await this.addQueue('project_deletion_alert', to, options, undefined, locale)
  }

  async projectDeletionRequest(
    to: string,
    options: ProjectDeletionRequestOptions,
    locale?: string
  ) {
    await this.addQueue('project_deletion_request', to, options, undefined, locale)
  }

  async scheduleAccountDeletionAlert(to: string, fullName: string, locale?: string) {
    await this.addQueue(
      'schedule_account_deletion_alert',
      to,
      {
        fullName,
        email: to
      },
      undefined,
      locale
    )
  }

  async submissionNotification(
    to: string,
    options: SubmissionNotificationOptions,
    locale?: string
  ) {
    await this.addQueue('submission_notification', to, options, undefined, locale)
  }

  async teamDataExportReady(to: string, link: string) {
    await this.addQueue('team_data_export_ready', to, {
      link
    })
  }

  async teamDeletionAlert(to: string, options: TeamDeletionAlertOptions, locale?: string) {
    await this.addQueue('team_deletion_alert', to, options, undefined, locale)
  }

  async teamDeletionRequest(to: string, options: TeamDeletionRequestOptions, locale?: string) {
    await this.addQueue('team_deletion_request', to, options, undefined, locale)
  }

  async teamInvitation(to: string, options: TeamInvitationOptions, locale?: string) {
    await this.addQueue(
      'team_invitation',
      to,
      {
        ...options,
        email: to
      },
      undefined,
      locale
    )
  }

  async userSecurityAlert(to: string, options: UserSecurityAlertOptions) {
    await this.addQueue('user_security_alert', to, options)
  }

  private init() {
    this.loadTemplates(DEFAULT_LOCALE, readdirSync(EMAIL_TEMPLATES_DIR, { withFileTypes: true }))

    const localeDirs = readdirSync(EMAIL_TEMPLATES_DIR, { withFileTypes: true }).filter(entry =>
      entry.isDirectory()
    )

    localeDirs.forEach(entry => {
      const localePath = join(EMAIL_TEMPLATES_DIR, entry.name)
      this.loadTemplates(entry.name, readdirSync(localePath, { withFileTypes: true }), localePath)
    })
  }

  private loadTemplates(locale: string, entries: Dirent[], basePath = EMAIL_TEMPLATES_DIR) {
    const filePaths = entries
      .filter(file => file.isFile() && extname(file.name) === HTML_EXT)
      .map(file => join(basePath, file.name))

    for (const filePath of filePaths) {
      const name = basename(filePath, HTML_EXT)
      const content = readFileSync(filePath).toString('utf8')
      const matches = content.match(TEMPLATE_META_REGEX)

      const html = content.replace(TEMPLATE_META_REGEX, '')

      if (matches) {
        const metaLines = matches[1].split('\n')
        const metaObject: Record<string, string> = {}

        metaLines.forEach(line => {
          const [key, value] = line.split(':')

          if (helper.isValid(key) && helper.isValid(value)) {
            metaObject[key.trim()] = value.trim()
          }
        })

        this.emailTemplates[locale] ||= {}
        this.emailTemplates[locale][name] = {
          subject: metaObject.title,
          html
        }
      }
    }
  }

  private async addQueue(
    templateName: string,
    to: string,
    replacements?: Record<string, any>,
    options?: JobOptions,
    locale = DEFAULT_LOCALE
  ) {
    const result =
      this.emailTemplates[locale]?.[templateName] ||
      this.emailTemplates[DEFAULT_LOCALE]?.[templateName]

    if (helper.isEmpty(result)) {
      return
    }

    let subject = result!.subject
    let html = result!.html

    if (helper.isValid(replacements) && helper.isPlainObject(replacements)) {
      Object.keys(replacements!).forEach(key => {
        const value = replacements![key]
        const regex = new RegExp(`{${key}}`, 'g')

        subject = subject.replace(regex, value)
        html = html?.replace(regex, value)
      })
    }

    await this.mailQueue.add(
      {
        queueName: 'MailQueue',
        data: {
          from: SMTP_FROM,
          to,
          subject,
          html
        }
      },
      options
    )
  }
}
