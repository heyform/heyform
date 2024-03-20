import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { Auth, User } from '@decorator'
import { VerifyEmailInput } from '@graphql'
import { UserModel } from '@model'
import { AuthService, UserService } from '@service'

@Resolver()
@Auth()
export class VerifyEmailResolver {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) {}

  @Mutation(returns => Boolean)
  async verifyEmail(
    @User() user: UserModel,
    @Args('input') input: VerifyEmailInput
  ): Promise<boolean> {
    // Check if verify email attempts is exceeded
    const attemptsKey = `limit:verify_email:${user.id}`

    await this.authService.attemptsCheck(attemptsKey, async () => {
      const key = `verify_email:${user.id}`
      await this.authService.checkVerificationCode(key, input.code)
    })

    await this.userService.update(user.id, {
      isEmailVerified: true
    })

    return true
  }
}
