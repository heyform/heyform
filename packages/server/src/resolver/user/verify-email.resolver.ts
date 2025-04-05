import { Auth, User } from '@decorator'
import { VerifyEmailInput } from '@graphql'
import { UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { AuthService, QueueService, UserService } from '@service'
import { EspoCRMAction } from '@utils'

@Resolver()
@Auth()
export class VerifyEmailResolver {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly queueService: QueueService
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

    // Add to sendy
    this.queueService.addSendyQueue(user.email)

    // Add to espocrm
    this.queueService.addEspoCRMQueue({
      action: EspoCRMAction.CREATE_LEAD,
      userId: user.id,
      lead: {
        emailAddress: user.email,
        name: user.name,
        source: user.source
      }
    })

    // Report to lark
    this.userService.report(user.email)

    return true
  }
}
