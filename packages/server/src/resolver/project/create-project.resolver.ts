import { Auth, Team, TeamGuard, User } from '@decorator'
import { CreateProjectInput } from '@graphql'
import { helper } from '@heyform-inc/utils'
import { TeamModel, UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { ProjectService, TeamService } from '@service'

const { uniqueArray } = helper

@Resolver()
@Auth()
export class CreateProjectResolver {
  constructor(
    private readonly projectService: ProjectService,
    private readonly teamService: TeamService
  ) {}

  @TeamGuard()
  @Mutation(returns => String)
  async createProject(
    @User() user: UserModel,
    @Team() team: TeamModel,
    @Args('input') input: CreateProjectInput
  ): Promise<string> {
    // Like addProjectMember, a project only takes members of its workspace
    const teamMemberIds = new Set(
      (await this.teamService.findMembersInTeam(team.id)).map(member => member.memberId)
    )
    const memberIds: string[] = uniqueArray([
      team.ownerId,
      user.id,
      ...(helper.isValidArray(input.memberIds) ? input.memberIds : [])
    ]).filter(memberId => teamMemberIds.has(memberId))

    const projectId = await this.projectService.create({
      teamId: input.teamId,
      name: input.name,
      ownerId: user.id
    })

    await this.projectService.addMembers(
      memberIds.map(memberId => ({
        projectId,
        memberId
      }))
    )

    return projectId
  }
}
