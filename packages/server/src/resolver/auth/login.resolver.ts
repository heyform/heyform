import { BadRequestException, UseGuards } from '@nestjs/common'

import { GraphqlRequest, GraphqlResponse } from '@decorator'
import { APP_DISABLE_EMAIL_LOGIN } from '@environments'
import { LoginInput } from '@graphql'
import { DeviceIdGuard } from '@guard'
import { date, helper } from '@heyform-inc/utils'
import { UserActivityKindEnum } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { AuthService, MailService, UserService } from '@service'
import { ClientInfo, GqlClient, comparePassword } from '@utils'

@Resolver()
@UseGuards(DeviceIdGuard)
export class LoginResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly mailService: MailService
  ) {}

  @Query(returns => Boolean)
  async login(
    @GqlClient() client: ClientInfo,
    @GraphqlRequest() req: any,
    @GraphqlResponse() res: any,
    @Args('input') input: LoginInput
  ): Promise<boolean> {
    if (APP_DISABLE_EMAIL_LOGIN) {
      throw new BadRequestException('Email login is disabled.')
    }

    const user = await this.userService.findByEmail(input.email)

    if (helper.isEmpty(user)) {
      throw new BadRequestException('Incorrect email or password.')
    }

    const key = `limit:login:${user.id}`

    await this.authService.attemptsCheck(key, async () => {
      if (helper.isEmpty(user.password)) {
        throw new BadRequestException('Incorrect email or password.')
      }

      const verified = await comparePassword(input.password, user.password)

      if (!verified) {
        throw new BadRequestException('Incorrect email or password.')
      }
    })

    const devices = await this.authService.devices(user.id)

    if (helper.isValid(devices) && !devices.includes(client.deviceId)) {
      this.mailService.userSecurityAlert(user.email, {
        deviceModel: `${client.userAgent.browser.name} on ${client.userAgent.os.name}`,
        ip: client.ip,
        loginAt: date().format('YYYY-MM-DD HH:mm:ss')
      })
    }

    this.authService.createUserActivity({
      kind: UserActivityKindEnum.LOGIN,
      userId: user.id,
      ...client
    })

    await this.authService.login({
      res,
      userId: user.id,
      deviceId: client.deviceId
    })

    return true
  }
}
