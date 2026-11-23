import { Auth, Team, TeamGuard, User } from '@decorator'
import { ProjectType, TeamDetailInput } from '@graphql'
import { ProjectModel, TeamModel, UserModel } from '@model'
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
    @Team() team: TeamModel,
    @Args('input') input: TeamDetailInput
  ): Promise<ProjectModel[]> {
    return this.projectService.findAccessibleInTeams(user.id, [team])
  }
}
