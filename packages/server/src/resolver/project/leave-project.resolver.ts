import { BadRequestException } from '@nestjs/common'

import { Auth, ProjectGuard, Team, User } from '@decorator'
import { ProjectDetailInput } from '@graphql'
import { TeamModel, UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { ProjectService } from '@service'

@Resolver()
@Auth()
export class LeaveProjectResolver {
  constructor(private readonly projectService: ProjectService) {}

  @ProjectGuard()
  @Mutation(returns => Boolean)
  async leaveProject(
    @User() user: UserModel,
    @Team() team: TeamModel,
    @Args('input') input: ProjectDetailInput
  ): Promise<boolean> {
    if (team.isOwner) {
      throw new BadRequestException('A workspace owner cannot leave a project')
    }

    return this.projectService.deleteMember(input.projectId, user.id)
  }
}
