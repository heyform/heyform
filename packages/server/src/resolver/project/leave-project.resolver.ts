import { Auth, ProjectGuard, User } from '@decorator'
import { ProjectDetailInput } from '@graphql'
import { UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { ProjectService } from '@service'

@Resolver()
@Auth()
export class LeaveProjectResolver {
  constructor(private readonly projectService: ProjectService) {}

  @ProjectGuard()
  @Mutation(returns => Boolean)
  async leaveProject(
    @User() user: UserModel,
    @Args('input') input: ProjectDetailInput
  ): Promise<boolean> {
    return this.projectService.deleteMember(input.projectId, user.id)
  }
}
