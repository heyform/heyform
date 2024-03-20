import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { Auth, Team, TeamGuard, User } from '@decorator'
import { UpdateTeamInput } from '@graphql'
import { TeamModel, UserModel } from '@model'
import { TeamService } from '@service'

@Resolver()
@Auth()
export class UpdateTeamResolver {
  constructor(private readonly teamService: TeamService) {}

  @Mutation(returns => Boolean)
  @TeamGuard()
  async updateTeam(
    @User() user: UserModel,
    @Team() team: TeamModel,
    @Args('input') input: UpdateTeamInput
  ): Promise<boolean> {
    if (!team.isOwner) {
      throw new BadRequestException("You don't have permission to change the workspace settings")
    }

    return await this.teamService.update(input.teamId, input)
  }
}
