import { BadRequestException, UseGuards } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { helper } from '@heyform-inc/utils'

import { BCRYPT_SALT } from '@environments'
import { ResetPasswordInput } from '@graphql'
import { BrowserIdGuard } from '@guard'
import { AuthService, MailService, UserService } from '@service'
import { passwordHash } from '@utils'

@Resolver()
@UseGuards(BrowserIdGuard)
export class ResetPasswordResolver {
  constructor(
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) {}

  @Mutation(returns => Boolean)
  async resetPassword(@Args('input') input: ResetPasswordInput): Promise<boolean> {
    const user = await this.userService.findByEmail(input.email)

    if (helper.isEmpty(user)) {
      throw new BadRequestException('The email address does not exist')
    }

    // // Check if reset password attempts is exceeded
    const key = `limit:reset_password:${user.id}`

    await this.authService.attemptsCheck(key, async () => {
      if (user.email !== input.email) {
        throw new BadRequestException('The email address does not exist')
      }

      const codeKey = `reset_password:${user.id}`
      await this.authService.checkVerificationCode(codeKey, input.code)
    })

    await this.userService.update(user.id, {
      password: await passwordHash(input.password, BCRYPT_SALT)
    })

    this.mailService.passwordChangeAlert(user.email)

    return true
  }
}
