/**
 * @program: serves
 * @description:
 * @author: mufeng
 * @date: 12/27/21 1:09 PM
 **/

import { Auth, User } from '@decorator'
import { UserModel } from '@model'
import { Query, Resolver } from '@nestjs/graphql'
import { AuthService, MailService } from '@service'

@Resolver()
@Auth()
export class UserDeletionCodeResolver {
  constructor(
    private readonly mailService: MailService,
    private readonly authService: AuthService
  ) {}

  @Query(returns => Boolean)
  async userDeletionCode(@User() user: UserModel): Promise<boolean> {
    const key = `user_deletion:${user.id}`
    const code = await this.authService.getVerificationCode(key)

    await this.mailService.accountDeletionRequest(user.email, code)

    return true
  }
}
