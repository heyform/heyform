import { Auth, TeamGuard } from '@decorator'
import { DeleteGroupInput } from '@graphql'
import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { GroupService } from '@service'

@Resolver()
@Auth()
export class DeleteGroupResolver {
  constructor(private readonly groupService: GroupService) {}

  @TeamGuard()
  @Mutation(returns => Boolean)
  async deleteGroup(@Args('input') input: DeleteGroupInput): Promise<boolean> {
    const groupCount = await this.groupService.count(input.teamId)

    if (groupCount <= 1) {
      throw new BadRequestException(
        'There must be at least one group default for audience sharing'
      )
    }

    return this.groupService.delete(input.teamId, input.groupId)
  }
}
