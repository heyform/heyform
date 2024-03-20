import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { helper } from '@heyform-inc/utils'

import { Auth, User } from '@decorator'
import { UpdateUserInput } from '@graphql'
import { UserModel } from '@model'
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
    const updates: Record<string, string> = {}

    if (helper.isValid(input.name)) {
      updates.name = input.name
    }

    if (helper.isValid(input.avatar)) {
      updates.avatar = input.avatar
    }

    if (helper.isEmpty(updates)) {
      throw new BadRequestException('Invalid arguments')
    }

    return await this.userService.update(user.id, updates)
  }
}
