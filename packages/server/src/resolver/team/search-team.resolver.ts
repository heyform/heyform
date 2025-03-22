import { Args, Query, Resolver } from '@nestjs/graphql'
import { Auth, Team, TeamGuard, User } from '@decorator'
import { FormService, ProjectService } from '@service'
import { SearchTeamInput, SearchTeamType } from '@graphql'
import { TeamModel, UserModel } from '@model'
import { HelpCenter } from '@utils'
import { HELP_CENTER_API_URL } from '@environments'

// Can't import this module in the top of the file
const MiniSearch = require('minisearch')

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

    const [forms, result] = await Promise.all([
      this.formService.searchInTeam(team.id, projectIds, input.query),
      HelpCenter.init(HELP_CENTER_API_URL).contents()
    ])

    const miniSearch = new MiniSearch({
      fields: ['title', 'description', 'content']
    })

    miniSearch.addAll(result.list)

    const matches = miniSearch.search(input.query)

    return {
      forms,
      docs: matches.map(m => result.list.find(r => r.id === m.id))
    }
  }
}
