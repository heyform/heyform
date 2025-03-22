/**
 * Created by jiangwei on 2020/10/26.
 * Copyright (c) 2020 Heyooo, Inc. all rights reserved
 */
import { timestamp } from '@heyform-inc/utils'
import { Process, Processor } from '@nestjs/bull'
import { FailedTaskService, TeamService } from '@service'
import { BaseQueue } from '../queue/base.queue'

@Processor('ResetInviteCodeSchedule')
export class ResetInviteCodeSchedule extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly teamService: TeamService
  ) {
    super(failedTaskService)
  }

  @Process()
  async resetInviteCode(): Promise<void> {
    try {
      const teams = await this.teamService.findAllBy({
        $or: [
          {
            inviteCodeExpireAt: {
              $lte: timestamp(),
              $gte: 0
            }
          },
          {
            inviteCodeExpireAt: {
              $exists: false
            }
          }
        ]
      })
      const teamIds = teams.map(team => team.id)
      for (const team of teams) {
        await this.teamService.resetInviteCode(team.id)
      }
      this.logger.info(`teams ${teamIds.join(',')} reset invite code`)
    } catch (error) {
      this.logger.error(`teams reset invite code error: ${error}`)
    }
  }
}
