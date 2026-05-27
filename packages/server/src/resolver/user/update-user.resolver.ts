import { Auth, User } from '@decorator'
import { UpdateUserInput } from '@graphql'
import { helper } from '@heyform-inc/utils'
import { UserLangEnum, UserModel } from '@model'
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

    if (helper.isValid(input.lang) && Object.values(UserLangEnum).includes(input.lang)) {
      updates.lang = input.lang
    }

    if (helper.isValid(updates)) {
      return this.userService.update(user.id, updates)
    }

    return false
  }
}
