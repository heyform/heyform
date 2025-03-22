import { Auth, TeamGuard } from '@decorator'
import { CreateGroupInput } from '@graphql'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { GroupService } from '@service'

@Resolver()
@Auth()
export class CreateGroupResolver {
  constructor(private readonly groupService: GroupService) {}

  @TeamGuard()
  @Mutation(returns => String)
  async createGroup(@Args('input') input: CreateGroupInput): Promise<string> {
    return this.groupService.create(input)
  }
}
