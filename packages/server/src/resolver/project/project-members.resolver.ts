import { Auth, Project, ProjectGuard, Team } from '@decorator'
import { ProjectDetailInput, UserDetailType } from '@graphql'
import { ProjectModel, TeamModel, UserModel, getTeamOwnerIds } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { ProjectService, UserService } from '@service'

@Resolver()
@Auth()
export class ProjectMembersResolver {
  constructor(
    private readonly projectService: ProjectService,
    private readonly userService: UserService
  ) {}

  @ProjectGuard()
  @Query(returns => [UserDetailType])
  async projectMembers(
    @Project() project: ProjectModel,
    @Team() team: TeamModel,
    @Args('input') input: ProjectDetailInput
  ): Promise<UserModel[]> {
    const members = await this.projectService.findMembers(input.projectId)
    const memberIds = [...new Set([...getTeamOwnerIds(team), ...members.map(row => row.memberId)])]
    return this.userService.findAll(memberIds)
  }
}
