import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'

import { APP_HOMEPAGE_URL } from '@environments'
import { answersToHtml } from '@heyform-inc/answer-utils'
import { FormService, MailService, SubmissionService, UserService } from '@service'
import { readNotificationRecipients } from '@utils'

import { BaseQueue } from './base.queue'

interface SubmissionNotificationJob {
  formId: string
  submissionId: string
  // Addresses already handed to the mail queue by a previous attempt of this job
  notified?: string[]
}

@Processor('SubmissionNotificationQueue')
export class SubmissionNotificationQueue extends BaseQueue {
  constructor(
    private readonly submissionService: SubmissionService,
    private readonly mailService: MailService,
    private readonly formService: FormService,
    private readonly userService: UserService
  ) {
    super()
  }

  @Process()
  async process(job: Job<SubmissionNotificationJob>): Promise<any> {
    const [submission, form] = await Promise.all([
      this.submissionService.findById(job.data.submissionId),
      this.formService.findById(job.data.formId)
    ])

    const user = await this.userService.findById(form.memberId)
    const html = answersToHtml(submission.answers)

    const options = {
      formName: form.name,
      submission: html,
      link: `${APP_HOMEPAGE_URL}/workspace/${form.teamId}/project/${form.projectId}/form/${form.id}/submissions`
    }

    // Extra recipients get the mail in the form's language; the owner keeps their own.
    const ownerEmail = user.email.trim().toLowerCase()
    // The settings typings ship from the published shared-types package, hence the loose access.
    const settings = (form.settings || {}) as Record<string, any>
    const recipients = readNotificationRecipients(settings.notificationRecipients).filter(
      email => email !== ownerEmail
    )

    const targets = [
      { to: user.email, locale: user.lang },
      ...recipients.map(to => ({ to, locale: settings.locale || user.lang }))
    ]

    // Attempt every address even if one fails, so a bad recipient never blocks the
    // others (or the owner). Failures are reported together once everyone was tried.
    // Successful addresses are persisted on the job so a Bull retry only resends
    // to the ones that failed instead of mailing everybody again.
    const notified = new Set(job.data.notified ?? [])
    const failed: string[] = []

    for (const target of targets) {
      if (notified.has(target.to)) {
        continue
      }

      try {
        await this.mailService.submissionNotification(target.to, options, target.locale)
      } catch (error) {
        failed.push(target.to)
        this.logger.error(
          `${job.queue.name}#${job.id} failed to notify ${target.to}: ${(error as Error)?.message}`
        )
        continue
      }

      notified.add(target.to)

      try {
        await job.update({ ...job.data, notified: Array.from(notified) })
      } catch (error) {
        // Not fatal: the mail is queued, a retry may just resend to this address
        this.logger.error(
          `${job.queue.name}#${job.id} failed to record ${target.to} as notified: ${(error as Error)?.message}`
        )
      }
    }

    if (failed.length > 0) {
      throw new Error(
        `Failed to send submission notification to ${failed.length} of ${targets.length} recipients`
      )
    }
  }
}
