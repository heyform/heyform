import { SMTP_FROM } from '@environments'
import { helper } from '@heyform-inc/utils'
import { EmailTemplateModel, UserLangEnum } from '@model'
import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { JobOptions, Queue } from 'bull'
import { Model } from 'mongoose'

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
  geoLocation: string
}

@Injectable()
export class MailService {
  constructor(
    @InjectQueue('MailQueue') private readonly mailQueue: Queue,
    @InjectModel(EmailTemplateModel.name)
    private readonly emailTemplateModel: Model<EmailTemplateModel>
  ) {}

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

  async formInvitation(to: string, link: string) {
    await this.addQueue('form_invitation', to, {
      link
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

  async projectDeletionRequest(
    to: string,
    options: ProjectDeletionRequestOptions
  ) {
    await this.addQueue('project_deletion_request', to, options)
  }

  async scheduleAccountDeletionAlert(to: string, fullName: string) {
    await this.addQueue('schedule_account_deletion_alert', to, {
      fullName,
      email: to
    })
  }

  async submissionNotification(
    to: string,
    options: SubmissionNotificationOptions
  ) {
    await this.addQueue('submission_notification', to, options)
  }

  async teamDataExportReady(to: string, link: string) {
    await this.addQueue('team_data_export_ready', to, {
      link
    })
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

  async userSecurityAlert(to: string, options: UserSecurityAlertOptions) {
    await this.addQueue('user_security_alert', to, options)
  }

  private async addQueue(
    templateName: string,
    to: string,
    replacements?: Record<string, any>,
    options?: JobOptions
  ) {
    const result = await this.emailTemplateModel.findOne({
      name: templateName,
      lang: UserLangEnum.EN
    })

    if (helper.isEmpty(result)) {
      return
    }

    let subject = result!.subject
    let html = result!.html
    let text = result!.text

    if (helper.isValid(replacements) && helper.isPlainObject(replacements)) {
      Object.keys(replacements!).forEach(key => {
        const value = replacements![key]
        const regex = new RegExp(`{${key}}`, 'g')

        subject = subject.replace(regex, value)
        html = html?.replace(regex, value)
        text = text?.replace(regex, value)
      })
    }

    await this.mailQueue.add(
      {
        queueName: 'MailQueue',
        data: {
          from: result!.from || SMTP_FROM,
          to,
          subject,
          text,
          html
        }
      },
      options
    )
  }
}
