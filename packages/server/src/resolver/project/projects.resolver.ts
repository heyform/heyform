import { Auth, TeamGuard, User } from '@decorator'
import { ProjectType, TeamDetailInput } from '@graphql'
import { ProjectModel, UserModel } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { ProjectService } from '@service'

@Resolver()
@Auth()
export class ProjectsResolver {
  constructor(private readonly projectService: ProjectService) {}

  @TeamGuard()
  @Query(returns => [ProjectType])
  async projects(
    @User() user: UserModel,
    @Args('input') input: TeamDetailInput
  ): Promise<ProjectModel[]> {
    const projectIds = await this.projectService.findProjectsByMemberId(user.id)

    return this.projectService.findByIds(projectIds, {
      teamId: input.teamId
    })
  }
}
