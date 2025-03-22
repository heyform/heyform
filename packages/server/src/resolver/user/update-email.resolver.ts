import { Auth, User } from '@decorator'
import { UpdateEmailInput } from '@graphql'
import { UserModel } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { AuthService, QueueService, UserService } from '@service'
import { EspoCRMAction } from '@utils'

@Resolver()
@Auth()
export class UpdateEmailResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly queueService: QueueService
  ) {}

  @Mutation(returns => Boolean)
  async updateEmail(
    @User() user: UserModel,
    @Args('input') input: UpdateEmailInput
  ): Promise<boolean> {
    const existsUser = await this.userService.findByEmail(input.email)

    if (existsUser) {
      throw new BadRequestException('The email address is already exists')
    }

    // Check if change email attempts is exceeded
    const attemptsKey = `limit:change_email:${user.id}`

    await this.authService.attemptsCheck(attemptsKey, async () => {
      // @Discard at 3 Mar 2022
      // 修改邮箱地址不需要输入密码
      // const verified = await comparePassword(input.password, user.password)
      //
      // if (!verified) {
      //   throw new BadRequestException('The password does not match')
      // }

      const key = `verify_email:${user.id}:${input.email}`
      await this.authService.checkVerificationCode(key, input.code)
    })

    const result = await this.userService.update(user.id, {
      email: input.email,
      isEmailVerified: true
    })

    // Add to sendy
    this.queueService.addSendyQueue(user.email)

    // Add to espocrm
    if (user.crmLeadId) {
      this.queueService.addEspoCRMQueue({
        action: EspoCRMAction.UPDATE_LEAD,
        id: user.crmLeadId,
        updates: {
          emailAddress: input.email
        }
      })
    } else {
      this.queueService.addEspoCRMQueue({
        action: EspoCRMAction.CREATE_LEAD,
        userId: user.id,
        lead: {
          name: user.name,
          emailAddress: input.email,
          source: user.source
        }
      })
    }

    return result
  }
}
