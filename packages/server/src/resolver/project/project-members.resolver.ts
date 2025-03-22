import { Auth, Project, ProjectGuard } from '@decorator'
import { ProjectDetailInput, UserDetailType } from '@graphql'
import { ProjectModel, UserModel } from '@model'
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
    @Args('input') input: ProjectDetailInput
  ): Promise<UserModel[]> {
    const members = await this.projectService.findMembers(input.projectId)
    const memberIds = members.map(row => row.memberId)
    return this.userService.findAll(memberIds)
  }
}
