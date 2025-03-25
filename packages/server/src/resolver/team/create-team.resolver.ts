import { Auth, User } from '@decorator'
import { CreateTeamInput } from '@graphql'
import { timestamp } from '@heyform-inc/utils'
import {
  BillingCycleEnum,
  // PlanGradeEnum,
  SubscriptionStatusEnum,
  TeamRoleEnum,
  UserModel
} from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { ProjectService, TeamService } from '@service'

@Resolver()
@Auth()
export class CreateTeamResolver {
  constructor(
    // private readonly planService: PlanService,
    private readonly teamService: TeamService,
    private readonly projectService: ProjectService
  ) {}

  @Mutation(returns => String)
  async createTeam(
    @User() user: UserModel,
    @Args('input') input: CreateTeamInput
  ): Promise<string> {
    // Attached Free plan to newly created team
    // const freePlan = await this.planService.findByGrade(PlanGradeEnum.FREE)

    const teamId = await this.teamService.create({
      ownerId: user.id,
      name: input.name,
      avatar: input.avatar,
      storageQuota: 0,
      subscription: {
        planId: '',
        billingCycle: BillingCycleEnum.FOREVER,
        startAt: timestamp(),
        endAt: -1,
        status: SubscriptionStatusEnum.ACTIVE
      }
    })

    await this.teamService.createMember({
      teamId,
      memberId: user.id,
      role: TeamRoleEnum.ADMIN
    })

    // 新建 project
    await this.projectService.createByNewTeam(
      teamId,
      user.id,
      input.projectName
    )

    return teamId
  }
}
