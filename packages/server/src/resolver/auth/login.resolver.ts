import {
  ClientInfo,
  GqlClient,
  GraphqlRequest,
  GraphqlResponse
} from '@decorator'
import { LoginInput } from '@graphql'
import { DeviceIdGuard } from '@guard'
import { comparePassword } from '@heyforms/nestjs'
import { date, helper } from '@heyform-inc/utils'
import { UserActivityKindEnum } from '@model'
import { BadRequestException, UseGuards } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { AuthService, MailService, UserService } from '@service'
import { getName as getCountryName } from 'country-list'

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
    const user = await this.userService.findByEmail(input.email)

    if (helper.isEmpty(user)) {
      throw new BadRequestException('The password does not match')
    }

    // Check if login attempts is exceeded
    const key = `limit:login:${user.id}`

    await this.authService.attemptsCheck(key, async () => {
      if (helper.isEmpty(user.password)) {
        throw new BadRequestException('The password does not match')
      }

      const verified = await comparePassword(input.password, user.password)

      if (!verified) {
        throw new BadRequestException('The password does not match')
      }
    })

    // Check if login in with a new device
    const devices = await this.authService.devices(user.id)

    if (helper.isValid(devices) && !devices.includes(client.deviceId)) {
      this.mailService.userSecurityAlert(user.email, {
        deviceModel: `${client.userAgent.browser.name} on ${client.userAgent.os.name}`,
        ip: client.ip,
        loginAt: date().format('YYYY-MM-DD HH:mm:ss'),
        geoLocation: `${client.geoLocation.city}, ${getCountryName(
          client.geoLocation.country
        )}`
      })
    }

    // TODO - remove 1 year ago activities
    // Create login activity
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
