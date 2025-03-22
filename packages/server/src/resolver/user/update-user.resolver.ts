import { Auth, User } from '@decorator'
import { UpdateUserInput } from '@graphql'
import { helper, timestamp } from '@heyform-inc/utils'
import { UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { UserService } from '@service'

@Resolver()
@Auth()
export class UpdateUserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(returns => Boolean)
  async updateUser(
    @User() user: UserModel,
    @Args('input') input: UpdateUserInput
  ): Promise<boolean> {
    const updates: Record<string, string | number> = {}

    if (helper.isValid(input.name)) {
      updates.name = input.name
    }

    if (helper.isValid(input.avatar)) {
      updates.avatar = input.avatar
    }

    if (input.isOnboarded) {
      updates.onboardedAt = timestamp()
    }

    if (helper.isValid(updates)) {
      return this.userService.update(user.id, updates)
    }

    return false
  }
}
