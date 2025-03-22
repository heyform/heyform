import { Auth, User } from '@decorator'
import { TeamType } from '@graphql'
import { helper } from '@heyform-inc/utils'
import {
  PlanGradeEnum,
  SubscriptionStatusEnum,
  TeamModel,
  UserModel
} from '@model'
import { Query, Resolver } from '@nestjs/graphql'
import {
  BrandKitService,
  CustomDomainService,
  FormService,
  PlanService,
  ProjectService,
  TeamService
} from '@service'

@Resolver()
@Auth()
export class TeamsResolver {
  constructor(
    private readonly planService: PlanService,
    private readonly teamService: TeamService,
    private readonly formService: FormService,
    private readonly customHostnameService: CustomDomainService,
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
    const projectIds = await this.projectService.findProjectsByMemberId(user.id)

    const [
      memberCountMaps,
      projects,
      projectMembers,
      formCountMaps,
      plans,
      customHostnames,
      brandKits
    ] = await Promise.all([
      this.teamService.memberCountMaps(teamIds),
      this.projectService.findByIds(projectIds),
      this.projectService.findMembers(projectIds),
      this.formService.countMaps(projectIds),
      this.planService.findAll(),
      this.customHostnameService.findAllInTeams(teamIds),
      this.brandKitService.findAllInTeams(teamIds)
    ])

    return teams.map(team => {
      team.projects = projects
        .filter(row => row.teamId === team.id)
        .map(project => {
          project.members = projectMembers
            .filter(m => m.projectId === project.id)
            .map(m => m.memberId)
          project.formCount =
            formCountMaps.find(m => m._id === project.id)?.count || 0
          return project
        })
      team.isOwner = team.ownerId === user.id
      team.memberCount =
        memberCountMaps.find(row => row._id === team.id)?.count || 0
      team.customDomain = customHostnames.find(
        row => row.teamId === team.id
      )?.domain

      team.brandKits = brandKits.filter(row => row.teamId === team.id)

      // Replace with Free Plan if the team's subscription is expired or pending payment
      if (team.subscription?.status === SubscriptionStatusEnum.ACTIVE) {
        team.plan = plans.find(plan => plan.id === team.subscription.planId)
      } else {
        team.plan = plans.find(plan => plan.grade === PlanGradeEnum.FREE)
      }

      return team
    })
  }
}
