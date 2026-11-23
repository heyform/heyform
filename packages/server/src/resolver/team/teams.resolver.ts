import { Auth, User } from '@decorator'
import { TeamType } from '@graphql'
import { helper } from '@heyform-inc/utils'
import { TeamModel, UserModel, getTeamOwnerIds, isTeamOwner } from '@model'
import { Query, Resolver } from '@nestjs/graphql'
import { BrandKitService, FormService, ProjectService, TeamService } from '@service'

@Resolver()
@Auth()
export class TeamsResolver {
  constructor(
    private readonly teamService: TeamService,
    private readonly formService: FormService,
    private readonly projectService: ProjectService,
    private readonly brandKitService: BrandKitService
  ) {}

  @Query(returns => [TeamType])
  async teams(@User() user: UserModel): Promise<TeamModel[]> {
    const teams = await this.teamService.findAll(user.id)

    if (helper.isEmpty(teams)) {
      return []
    }

    const teamIds = teams.map(row => row.id)
    const projects = await this.projectService.findAccessibleInTeams(user.id, teams)
    const projectIds = projects.map(project => project.id)

    const [memberCountMaps, projectMembers, formCountMaps, brandKits] = await Promise.all([
      this.teamService.memberCountMaps(teamIds),
      this.projectService.findMembers(projectIds),
      this.formService.countMaps(projectIds),
      this.brandKitService.findAllInTeams(teamIds)
    ])

    return teams.map(team => {
      team.projects = projects
        .filter(row => row.teamId === team.id)
        .map(project => {
          project.members = [
            ...new Set([
              ...getTeamOwnerIds(team),
              ...projectMembers.filter(m => m.projectId === project.id).map(m => m.memberId)
            ])
          ]
          project.formCount = formCountMaps.find(m => m._id === project.id)?.count || 0
          return project
        })
      team.isOwner = isTeamOwner(team, user.id)
      team.memberCount = memberCountMaps.find(row => row._id === team.id)?.count || 0

      team.brandKits = brandKits.filter(row => row.teamId === team.id)

      return team
    })
  }
}
