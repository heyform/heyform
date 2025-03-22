/**
 * @program: serves
 * @description:
 * @author: mufeng
 * @date: 12/27/21 1:09 PM
 **/

import { Auth, User } from '@decorator'
import { ACCOUNT_DELETION_SCHEDULE_INTERVAL } from '@environments'
import { VerifyUserDeletionInput } from '@graphql'
import { hs, timestamp } from '@heyform-inc/utils'
import { UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { AuthService, MailService, UserService } from '@service'

@Resolver()
@Auth()
export class VerifyUserDeletionResolver {
  constructor(
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) {}

  @Mutation(returns => Boolean)
  async verifyUserDeletion(
    @User() user: UserModel,
    @Args('input') input: VerifyUserDeletionInput
  ): Promise<boolean> {
    // Check if user deletion attempts is exceeded
    const attemptsKey = `limit:user_deletion:${user.id}`

    await this.authService.attemptsCheck(attemptsKey, async () => {
      const key = `user_deletion:${user.id}`
      await this.authService.checkVerificationCode(key, input.code)
    })

    await this.userService.update(user.id, {
      isDeletionScheduled: true,
      deletionScheduledAt: timestamp() + hs(ACCOUNT_DELETION_SCHEDULE_INTERVAL)
    })

    await this.mailService.scheduleAccountDeletionAlert(user.email, user.name)

    return true
  }
}
