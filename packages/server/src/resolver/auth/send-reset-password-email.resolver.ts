import { BadRequestException, UseGuards } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { helper } from '@heyform-inc/utils'

import { SendResetPasswordEmailInput } from '@graphql'
import { BrowserIdGuard } from '@guard'
import { AuthService, MailService, UserService } from '@service'

@Resolver()
@UseGuards(BrowserIdGuard)
export class SendResetPasswordEmailResolver {
  constructor(
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) {}

  @Mutation(returns => Boolean)
  async sendResetPasswordEmail(
    @Args('input') input: SendResetPasswordEmailInput
  ): Promise<boolean> {
    const user = await this.userService.findByEmail(input.email)

    if (helper.isEmpty(user)) {
      throw new BadRequestException('The email address does not exist')
    }

    // Add a code of reset password to cache
    const key = `reset_password:${user.id}`
    const code = await this.authService.getVerificationCode(key)

    this.mailService.emailVerificationRequest(input.email, code)
    return true
  }
}
