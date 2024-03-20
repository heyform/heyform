import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { Auth, User } from '@decorator'
import { CreateTeamInput } from '@graphql'
import { TeamRoleEnum, UserModel } from '@model'
import { ProjectService, TeamService } from '@service'

@Resolver()
@Auth()
export class CreateTeamResolver {
  constructor(
    private readonly teamService: TeamService,
    private readonly projectService: ProjectService
  ) {}

  @Mutation(returns => String)
  async createTeam(
    @User() user: UserModel,
    @Args('input') input: CreateTeamInput
  ): Promise<string> {
    const teamId = await this.teamService.create({
      ownerId: user.id,
      name: input.name,
      avatar: input.avatar,
      storageQuota: 0
    })

    await this.teamService.createMember({
      teamId,
      memberId: user.id,
      role: TeamRoleEnum.ADMIN
    })

    // Create project
    await this.projectService.createByNewTeam(teamId, user.id, user.name)

    return teamId
  }
}
