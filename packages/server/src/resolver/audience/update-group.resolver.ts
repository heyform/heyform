import { Auth, TeamGuard } from '@decorator'
import { UpdateGroupInput } from '@graphql'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { GroupService } from '@service'

@Resolver()
@Auth()
export class UpdateGroupResolver {
  constructor(private readonly groupService: GroupService) {}

  @TeamGuard()
  @Mutation(returns => Boolean)
  async updateGroup(@Args('input') input: UpdateGroupInput): Promise<boolean> {
    return this.groupService.update(input.teamId, input.groupId, input.name)
  }
}
