import { Args, Query, Resolver } from '@nestjs/graphql'
import { Auth, Team, TeamGuard, User } from '@decorator'
import { FormService, ProjectService } from '@service'
import { SearchTeamInput, SearchTeamType } from '@graphql'
import { TeamModel, UserModel } from '@model'

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
    const projectIds = await this.projectService.findProjectsByMemberId(user.id)
    const forms = await this.formService.searchInTeam(
      team.id,
      projectIds,
      input.query
    )

    return {
      forms,
      docs: []
    }
  }
}
