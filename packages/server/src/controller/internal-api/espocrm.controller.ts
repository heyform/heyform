import { Controller, Get, HttpCode } from '@nestjs/common'
import { PlanService, QueueService, TeamService, UserService } from '@service'
import { EspoCRMAction } from '@utils'
import { PlanGradeEnum } from '@model'
import { unixDate } from '@heyform-inc/utils'

const BILLING_CYCLES = [, 'monthly', 'yearly']

@Controller()
export class EspocrmController {
  constructor(
    private readonly planService: PlanService,
    private readonly userService: UserService,
    private readonly teamService: TeamService,
    private readonly queueService: QueueService
  ) {}

  @Get('/7IRORkY5Fa-internal-espocrm-sync')
  @HttpCode(200)
  async index() {
    const users = await this.userService._internalFindAll()

    let i = 0

    for (const user of users) {
      if (!user.crmLeadId) {
        i += 1

        this.queueService.addEspoCRMQueue(
          {
            action: EspoCRMAction.CREATE_LEAD,
            userId: user.id,
            lead: {
              name: user.name,
              emailAddress: user.email,
              source: user.source
            }
          },
          {
            delay: i * 60 * 1_000
          }
        )
      }
    }

    const rowPlans = await this.planService.findAll()

    const plans = rowPlans.filter(p => p.grade > PlanGradeEnum.FREE)
    const teams = await this.teamService._internalFindAll2(plans.map(p => p.id))

    const owners = await this.userService.findAll(teams.map(t => t.ownerId))

    let k = 0

    for (const team of teams) {
      if (!team.crmAccountId) {
        k += 1

        const owner = owners.find(u => u.id === team.ownerId)
        const plan = plans.find(p => p.id === team.subscription.planId)

        const billingCycle = BILLING_CYCLES[team.subscription.billingCycle]
        const endsAt = unixDate(team.subscription.endAt).format('YYYY-MM-DD')

        this.queueService.addEspoCRMQueue(
          {
            action: EspoCRMAction.CREATE_ACCOUNT,
            teamId: team.id,
            account: {
              name: owner.name,
              emailAddress: owner.email,
              cCustomerStatus: team.subscription.trialing ? 'Trial' : 'Active',
              description: `${plan.name} Plan, ${billingCycle}, ends at ${endsAt}`
            }
          },
          {
            delay: k * 60 * 1_000
          }
        )
      }
    }
  }
}
