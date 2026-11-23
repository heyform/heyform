import { Auth, Team, TeamGuard, User } from '@decorator'
import { SetTeamMemberOwnerInput, TransferTeamInput } from '@graphql'
import { TeamModel, UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { TeamService } from '@service'

@Resolver()
@Auth()
export class TransferTeamResolver {
  constructor(private readonly teamService: TeamService) {}

  @Mutation(returns => Boolean)
  @TeamGuard()
  async transferTeam(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: TransferTeamInput
  ): Promise<boolean> {
    return this.teamService.changeOwnership(team.id, user.id, input.memberId, 'transfer')
  }

  @Mutation(returns => Boolean)
  @TeamGuard()
  async setTeamMemberOwner(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: SetTeamMemberOwnerInput
  ): Promise<boolean> {
    return this.teamService.changeOwnership(
      team.id,
      user.id,
      input.memberId,
      input.isOwner ? 'grant' : 'revoke'
    )
  }
}
