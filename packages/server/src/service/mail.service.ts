import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { JobOptions, Queue } from 'bull'
import { readFileSync } from 'fs'
import { basename } from 'path'

import { helper } from '@heyform-inc/utils'

import { EMAIL_TEMPLATES_DIR, SMTP_FROM } from '@environments'
import { readDirSync } from '@utils'

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

const HTML_EXT = '.html'
const TEMPLATE_META_REGEX = /^---([\s\S]*?)---[\n\s\S]\n/

@Injectable()
export class MailService {
  private readonly emailTemplates: Record<string, { subject: string; html: string }> = {}

  constructor(@InjectQueue('MailQueue') private readonly mailQueue: Queue) {
    this.init()
  }

  async accountDeletionAlert(to: string) {
    await this.addQueue('account_deletion_alert', to)
  }

  async accountDeletionRequest(to: string, code: string) {
    await this.addQueue('account_deletion_request', to, {
      code
    })
  }

  async emailVerificationRequest(to: string, code: string) {
    await this.addQueue('email_verification_request', to, {
      code
    })
  }

  async joinWorkspaceAlert(to: string, options: JoinWorkspaceAlertOptions) {
    await this.addQueue('join_workspace_alert', to, options)
  }

  async passwordChangeAlert(to: string) {
    await this.addQueue('password_change_alert', to)
  }

  async projectDeletionAlert(to: string, options: ProjectDeletionAlertOptions) {
    await this.addQueue('project_deletion_alert', to, options)
  }

  async projectDeletionRequest(to: string, options: ProjectDeletionRequestOptions) {
    await this.addQueue('project_deletion_request', to, options)
  }

  async scheduleAccountDeletionAlert(to: string, fullName: string) {
    await this.addQueue('schedule_account_deletion_alert', to, {
      fullName,
      email: to
    })
  }

  async submissionNotification(to: string, options: SubmissionNotificationOptions) {
    await this.addQueue('submission_notification', to, options)
  }

  async teamDeletionAlert(to: string, options: TeamDeletionAlertOptions) {
    await this.addQueue('team_deletion_alert', to, options)
  }

  async teamDeletionRequest(to: string, options: TeamDeletionRequestOptions) {
    await this.addQueue('team_deletion_request', to, options)
  }

  async teamInvitation(to: string, options: TeamInvitationOptions) {
    await this.addQueue('team_invitation', to, {
      ...options,
      email: to
    })
  }

  private init() {
    const filePaths = readDirSync(EMAIL_TEMPLATES_DIR, HTML_EXT)

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

        this.emailTemplates[name] = {
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
    options?: JobOptions
  ) {
    const result = this.emailTemplates[templateName]

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
