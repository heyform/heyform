import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { Auth, ProjectGuard, Team } from '@decorator'
import { ProjectMemberInput } from '@graphql'
import { TeamModel } from '@model'
import { ProjectService } from '@service'

@Resolver()
@Auth()
export class DeleteProjectMemberResolver {
  constructor(private readonly projectService: ProjectService) {}

  @ProjectGuard()
  @Mutation(returns => Boolean)
  async deleteProjectMember(
    @Team() team: TeamModel,
    @Args('input') input: ProjectMemberInput
  ): Promise<boolean> {
    if (input.memberId === team.ownerId) {
      throw new BadRequestException("You don't have permission to remove member from the project")
    }

    return this.projectService.deleteMember(input.projectId, input.memberId)
  }
}
