import { InjectQueue } from '@nestjs/bull'
import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { Queue } from 'bull'

@Injectable()
export class ScheduleService implements OnApplicationBootstrap {
  constructor(
    @InjectQueue('DeleteFormInTrashSchedule')
    private readonly deleteFormInTrashSchedule: Queue,
    @InjectQueue('ExpiredAppCodeTokenSchedule')
    private readonly expiredAppCodeTokenSchedule: Queue,
    @InjectQueue('ExpiredSubscriptionSchedule')
    private readonly expiredSubscriptionSchedule: Queue,
    @InjectQueue('RefreshThirdPartyOauthSchedule')
    private readonly refreshThirdPartyOauthSchedule: Queue,
    // Discard at Jun 26, 2024
    // @InjectQueue('ResetInviteCodeSchedule')
    // private readonly resetInviteCodeSchedule: Queue,
    // Discard at Dec 20, 2021 (v2021.12.3)
    // @InjectQueue('ResetSubmissionQuotaSchedule')
    // private readonly resetSubmissionQuotaSchedule: Queue,
    @InjectQueue('ResumeFailedTaskSchedule')
    private readonly resumeFailedTaskSchedule: Queue,
    // Add at Dec 27, 2021 (v2021.12.4)
    @InjectQueue('DeleteUserAccountSchedule')
    private readonly deleteUserAccountSchedule: Queue,
    @InjectQueue('BlockUserSchedule')
    private readonly blockUserSchedule: Queue
  ) {}

  /**
   * 初始化所有定时任务
   */
  async onApplicationBootstrap(): Promise<any> {
    await Promise.all([
      this.deleteFormInTrashSchedule.add(null, {
        repeat: {
          cron: '0 0 * * * *'
        }
      }),
      this.expiredAppCodeTokenSchedule.add(null, {
        repeat: {
          cron: '0 0 * * * *'
        }
      }),
      this.expiredSubscriptionSchedule.add(null, {
        repeat: {
          cron: '0 0 * * * *'
        }
      }),
      this.refreshThirdPartyOauthSchedule.add(null, {
        repeat: {
          cron: '0 */5 * * * *'
        }
      }),
      // Discard at Jun 26, 2024
      // this.resetInviteCodeSchedule.add(null, {
      //   repeat: {
      //     cron: '0 0 1 * * *'
      //   }
      // }),
      // Discard at Dec 20, 2021 (v2021.12.3)
      // this.resetSubmissionQuotaSchedule.add(null, {
      //   repeat: {
      //     cron: '0 0 0 * * *'
      //   }
      // }),
      this.resumeFailedTaskSchedule.add(null, {
        repeat: {
          cron: '0 */15 * * * *'
        }
      }),
      // Add at Dec 27, 2021 (v2021.12.4)
      this.deleteUserAccountSchedule.add(null, {
        repeat: {
          cron: '0 0 */1 * * *'
        }
      }),
      this.blockUserSchedule.add(null, {
        repeat: {
          cron: '0 0 */1 * * *'
        }
      })
    ])
  }
}
