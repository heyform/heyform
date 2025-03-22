import { BCRYPT_SALT } from '@environments'
import { ResetPasswordInput } from '@graphql'
import { DeviceIdGuard } from '@guard'
import { GqlLang, passwordHash } from '@heyforms/nestjs'
import { helper } from '@heyform-inc/utils'
import { UserLangEnum } from '@model'
import { BadRequestException, UseGuards } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { AuthService, MailService, UserService } from '@service'

@Resolver()
@UseGuards(DeviceIdGuard)
export class ResetPasswordResolver {
  constructor(
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) {}

  @Mutation(returns => Boolean)
  async resetPassword(
    @GqlLang() lang: UserLangEnum,
    @Args('input') input: ResetPasswordInput
  ): Promise<boolean> {
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
