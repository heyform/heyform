import { BullOptionsFactory } from '@config'
import { BullModule } from '@nestjs/bull'
import { DeleteFormInTrashSchedule } from './delete-form-in-trash.schedule'
import { ExpiredAppCodeTokenSchedule } from './expired-app-code-token.schedule'
import { ExpiredSubscriptionSchedule } from './expired-subscription.schedule'
import { RefreshThirdPartyOauthSchedule } from './refresh-third-party-oauth.schedule'
import { ResumeFailedTaskSchedule } from './resume-failed-task.schedule'
import { DeleteUserAccountSchedule } from './delete-user-account.schedule'

export const ScheduleProviders = {
  DeleteFormInTrashSchedule,
  ExpiredAppCodeTokenSchedule,
  ExpiredSubscriptionSchedule,
  RefreshThirdPartyOauthSchedule,
  // Discard at Jun 26, 2024
  // ResetInviteCodeSchedule,
  // Discard at Dec 20, 2021 (v2021.12.3)
  // ResetSubmissionQuotaSchedule,
  ResumeFailedTaskSchedule,
  // Add at Dec 27, 2021 (v2021.12.4)
  DeleteUserAccountSchedule
}

export const ScheduleModules = Object.keys(ScheduleProviders).map(
  scheduleName => {
    return BullModule.registerQueueAsync({
      name: scheduleName,
      useFactory: BullOptionsFactory
    })
  }
)
