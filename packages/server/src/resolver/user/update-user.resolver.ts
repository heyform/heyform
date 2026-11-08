import { BadRequestException } from '@nestjs/common'

import { Auth, User } from '@decorator'
import { UpdateUserInput } from '@graphql'
import { helper } from '@heyform-inc/utils'
import { UserLangEnum, UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { SocialLoginService, UserService } from '@service'

@Resolver()
@Auth()
export class UpdateUserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly socialLoginService: SocialLoginService
  ) {}

  @Mutation(returns => Boolean)
  async updateUser(
    @User() user: UserModel,
    @Args('input') input: UpdateUserInput
  ): Promise<boolean> {
    const updates: Record<string, string | number> = {}

    // An unchanged name isn't written back, so it can't undo a sign-in that just synced it
    if (helper.isValid(input.name) && input.name !== user.name) {
      if (await this.socialLoginService.isNameManaged(user.id)) {
        throw new BadRequestException('Your name is managed by your identity provider')
      }

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
