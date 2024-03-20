import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { Auth, User } from '@decorator'
import { UpdateEmailInput } from '@graphql'
import { UserModel } from '@model'
import { AuthService, UserService } from '@service'

@Resolver()
@Auth()
export class UpdateEmailResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  @Mutation(returns => Boolean)
  async updateEmail(
    @User() user: UserModel,
    @Args('input') input: UpdateEmailInput
  ): Promise<boolean> {
    const existsUser = await this.userService.findByEmail(input.email)

    if (existsUser) {
      throw new BadRequestException('The email address is already exists')
    }

    // Check if change email attempts is exceeded
    const attemptsKey = `limit:change_email:${user.id}`

    await this.authService.attemptsCheck(attemptsKey, async () => {
      const key = `verify_email:${user.id}:${input.email}`
      await this.authService.checkVerificationCode(key, input.code)
    })

    const result = await this.userService.update(user.id, {
      email: input.email,
      isEmailVerified: true
    })

    return result
  }
}
