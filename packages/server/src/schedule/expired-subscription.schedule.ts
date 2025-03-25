import { date, timestamp } from '@heyform-inc/utils'
import { BillingCycleEnum, SubscriptionStatusEnum } from '@model'
import { Process, Processor } from '@nestjs/bull'
import {
  FailedTaskService,
  // PlanService,
  QueueService,
  TeamService,
  UserService
} from '@service'
import { BaseQueue } from '../queue/base.queue'
import { EspoCRMAction } from '@utils'

@Processor('ExpiredSubscriptionSchedule')
export class ExpiredSubscriptionSchedule extends BaseQueue {
  constructor(
    failedTaskService: FailedTaskService,
    private readonly teamService: TeamService,
    // private readonly planService: PlanService,
    private readonly userService: UserService,
    private readonly queueService: QueueService
  ) {
    super(failedTaskService)
  }

  @Process()
  async expiredSubscription(): Promise<any> {
    const endAt = date().subtract(30, 'minute').unix()

    const teams = await this.teamService.findAllBy({
      'subscription.status': {
        $in: [SubscriptionStatusEnum.ACTIVE, SubscriptionStatusEnum.PENDING]
      },
      'subscription.endAt': {
        $lte: endAt,
        $gte: 0
      }
    })

    const teamIds = teams.map(team => team.id)
    // const freePlan = await this.planService.findByGrade(PlanGradeEnum.FREE)

    // Downgrade to Basic Plan once subscription expired
    await this.teamService.updateAll(teamIds, {
      'subscription.id': undefined,
      'subscription.planId': '',
      'subscription.billingCycle': BillingCycleEnum.FOREVER,
      'subscription.startAt': timestamp(),
      'subscription.endAt': -1,
      'subscription.status': SubscriptionStatusEnum.ACTIVE
    })

    const owners = await this.userService.findAll(teams.map(t => t.ownerId))

    for (const team of teams) {
      const owner = owners.find(o => o.id === team.ownerId)

      if (team.crmAccountId) {
        this.queueService.addEspoCRMQueue({
          action: EspoCRMAction.UPDATE_ACCOUNT,
          id: team.crmAccountId,
          updates: {
            cCustomerStatus: 'Churned'
          }
        })
      } else {
        this.queueService.addEspoCRMQueue({
          action: EspoCRMAction.CREATE_ACCOUNT,
          teamId: team.id,
          account: {
            name: owner.name,
            emailAddress: owner.email,
            cCustomerStatus: 'Churned'
          }
        })
      }
    }
  }
}
