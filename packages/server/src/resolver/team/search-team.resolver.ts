import { Auth, Team, TeamGuard, User } from '@decorator'
import { SearchTeamInput, SearchTeamType } from '@graphql'
import { TeamModel, UserModel } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { FormService, ProjectService } from '@service'

@Resolver()
@Auth()
export class SearchTeamResolver {
  constructor(
    private readonly projectService: ProjectService,
    private readonly formService: FormService
  ) {}

  @Query(returns => SearchTeamType)
  @TeamGuard()
  async searchTeam(
    @User() user: UserModel,
    @Team() team: TeamModel,
    @Args('input') input: SearchTeamInput
  ) {
    const projects = await this.projectService.findAccessibleInTeams(user.id, [team])
    const projectIds = projects.map(project => project.id)
    const forms = await this.formService.searchInTeam(team.id, projectIds, input.query)

    return {
      forms,
      docs: []
    }
  }
}
