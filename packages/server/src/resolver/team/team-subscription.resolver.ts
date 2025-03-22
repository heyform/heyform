import { Auth, Team, TeamGuard } from '@decorator'
import { TeamDetailInput, TeamSubscriptionType } from '@graphql'
import { TeamModel } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import {
  ContactService,
  FormService,
  SubmissionService,
  TeamService
} from '@service'

@Resolver()
@Auth()
export class TeamSubscriptionResolver {
  constructor(
    private readonly teamService: TeamService,
    private readonly formService: FormService,
    private readonly contactService: ContactService,
    private readonly submissionService: SubmissionService
  ) {}

  @Query(returns => TeamSubscriptionType)
  @TeamGuard()
  async teamSubscription(
    @Team() team: TeamModel,
    @Args('input') input: TeamDetailInput
  ): Promise<TeamSubscriptionType> {
    const [
      memberCount,
      contactCount,
      formCount,
      submissionQuota
    ] = await Promise.all([
      this.teamService.memberCount(team.id),
      this.contactService.count(team.id),
      this.formService.countAll(team.id),
      this.submissionService.countAllInTeam(team.id)
    ])

    return {
      memberCount,
      contactCount,
      formCount,
      // Discard at Dec 20, 2021 (v2021.12.3)
      // Reverted at Nov 28, 2023
      submissionQuota,
      storageQuota: team.storageQuota
    }
  }
}
