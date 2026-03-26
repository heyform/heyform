import { Auth, User } from '@decorator'
import { CreateTeamInput } from '@graphql'
import { APP_REMOVE_BRANDING } from '@environments'
import { TeamRoleEnum, UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
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
      storageQuota: 0,
      removeBranding: APP_REMOVE_BRANDING
    })

    await this.teamService.createMember({
      teamId,
      memberId: user.id,
      role: TeamRoleEnum.ADMIN
    })

    await this.projectService.createByNewTeam(teamId, user.id, input.projectName)

    return teamId
  }
}
