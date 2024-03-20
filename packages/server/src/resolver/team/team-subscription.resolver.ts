import { Args, Query, Resolver } from '@nestjs/graphql'

import { Auth, Team, TeamGuard } from '@decorator'
import { TeamDetailInput, TeamSubscriptionType } from '@graphql'
import { TeamModel } from '@model'
import { FormService, SubmissionService, TeamService } from '@service'

@Resolver()
@Auth()
export class TeamSubscriptionResolver {
  constructor(
    private readonly teamService: TeamService,
    private readonly formService: FormService,
    private readonly submissionService: SubmissionService
  ) {}

  @Query(returns => TeamSubscriptionType)
  @TeamGuard()
  async teamSubscription(
    @Team() team: TeamModel,
    @Args('input') input: TeamDetailInput
  ): Promise<TeamSubscriptionType> {
    const [memberCount, formCount, submissionQuota] = await Promise.all([
      this.teamService.memberCount(team.id),
      this.formService.countAll(team.id),
      this.submissionService.countAllInTeam(team.id)
    ])

    return {
      memberCount,
      formCount,
      submissionQuota,
      storageQuota: team.storageQuota
    }
  }
}
