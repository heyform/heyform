import { BadRequestException } from '@nestjs/common'

import { Auth, User } from '@decorator'
import { ChangeEmailCodeInput } from '@graphql'
import { UserModel } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { AuthService, MailService, UserService } from '@service'
import { isDisposableEmail } from '@utils'

@Resolver()
@Auth()
export class ChangeEmailCodeResolver {
  constructor(
    private readonly mailService: MailService,
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  @Query(returns => Boolean)
  async changeEmailCode(
    @User() user: UserModel,
    @Args('input') input: ChangeEmailCodeInput
  ): Promise<boolean> {
    if (isDisposableEmail(input.email)) {
      throw new BadRequestException(
        'Error: Disposable email address detected, please use a work email to create the account'
      )
    }

    const existsUser = await this.userService.findByEmail(input.email)

    if (existsUser) {
      throw new BadRequestException('The email address is already exists')
    }

    //

    //

    const key = `verify_email:${user.id}:${input.email}`
    const code = await this.authService.getVerificationCodeWithRateLimit(key)

    this.mailService.emailVerificationRequest(input.email, code, user.lang)

    return true
  }
}
