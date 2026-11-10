import { BadRequestException } from '@nestjs/common'

import { Auth, User } from '@decorator'
import { UpdateEmailInput } from '@graphql'
import { UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { AuthService, UserService } from '@service'
import { comparePassword, isDuplicateEmailError } from '@utils'

const EMAIL_TAKEN = 'The email address is already exists'

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
      throw new BadRequestException(EMAIL_TAKEN)
    }

    const attemptsKey = `limit:change_email:${user.id}`

    await this.authService.attemptsCheck(attemptsKey, async () => {
      const verified = await comparePassword(input.currentPassword, user.password)

      if (!verified) {
        throw new BadRequestException('The password does not match')
      }

      const key = `verify_email:${user.id}:${input.email}`
      await this.authService.checkVerificationCode(key, input.code)
    })

    let result: boolean

    try {
      result = await this.userService.update(user.id, {
        email: input.email,
        isEmailVerified: true
      })
    } catch (error) {
      // Another account took the address after the check above
      if (isDuplicateEmailError(error)) {
        throw new BadRequestException(EMAIL_TAKEN)
      }

      throw error
    }

    if (result) {
      await this.authService.invalidateSessions(user.id)
    }

    return result
  }
}
