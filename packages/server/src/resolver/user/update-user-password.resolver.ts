import { Auth, User } from '@decorator'
import { BCRYPT_SALT } from '@environments'
import { UpdateUserPasswordInput } from '@graphql'
import { comparePassword, passwordHash } from '@heyforms/nestjs'
import { UserModel } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { AuthService, MailService, UserService } from '@service'

@Resolver()
@Auth()
export class UpdateUserPasswordResolver {
  constructor(
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) {}

  @Mutation(returns => Boolean)
  async updateUserPassword(
    @User() user: UserModel,
    @Args('input') input: UpdateUserPasswordInput
  ): Promise<boolean> {
    // Check if update password attempts is exceeded
    const attemptsKey = `limit:update_password:${user.id}`

    await this.authService.attemptsCheck(attemptsKey, async () => {
      const verified = await comparePassword(
        input.currentPassword,
        user.password
      )

      if (!verified) {
        throw new BadRequestException('The password does not match')
      }
    })

    const result = await this.userService.update(user.id, {
      password: await passwordHash(input.newPassword, BCRYPT_SALT)
    })

    this.mailService.passwordChangeAlert(user.email)
    return result
  }
}
