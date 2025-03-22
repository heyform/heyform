import { Auth, User } from '@decorator'
import { UserModel } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Query, Resolver } from '@nestjs/graphql'
import { AuthService, MailService } from '@service'

@Resolver()
@Auth()
export class EmailVerificationCodeResolver {
  constructor(
    private readonly mailService: MailService,
    private readonly authService: AuthService
  ) {}

  @Query(returns => Boolean)
  async emailVerificationCode(@User() user: UserModel): Promise<boolean> {
    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified')
    }

    // Add a code of verify email address to cache
    const key = `verify_email:${user.id}`
    const code = await this.authService.getVerificationCode(key)

    this.mailService.emailVerificationRequest(user.email, code)

    return true
  }
}
