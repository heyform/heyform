import {
  ClientInfo,
  GqlClient,
  GraphqlRequest,
  GraphqlResponse
} from '@decorator'
import { BCRYPT_SALT } from '@environments'
import { SignUpInput } from '@graphql'
import { DeviceIdGuard } from '@guard'
import { gravatar, passwordHash } from '@heyforms/nestjs'
import { helper } from '@heyform-inc/utils'
import { UserActivityKindEnum } from '@model'
import { BadRequestException, UseGuards } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { AuthService, UserService } from '@service'
import { isDisposableEmail } from '@utils'
import { COOKIE_UTM_SOURCE_NAME } from '@config'

@Resolver()
@UseGuards(DeviceIdGuard)
export class SignUpResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  @Query(returns => Boolean)
  async signUp(
    @GqlClient() client: ClientInfo,
    @GraphqlRequest() req: any,
    @GraphqlResponse() res: any,
    @Args('input') input: SignUpInput
  ): Promise<boolean> {
    if (isDisposableEmail(input.email)) {
      throw new BadRequestException(
        'Error: Disposable email address detected, please use a work email to create the account'
      )
    }

    const existUser = await this.userService.findByEmail(input.email)

    if (helper.isValid(existUser)) {
      throw new BadRequestException('The email address already exist')
    }

    const userId = await this.userService.create({
      name: input.name,
      email: input.email,
      password: await passwordHash(input.password, BCRYPT_SALT),
      avatar: gravatar(input.email),
      lang: client.lang,
      // Add at 31 Aug 2024
      isOnboardRequired: true,
      onboardedAt: 0,
      source: req.cookies[COOKIE_UTM_SOURCE_NAME]
    })

    // Create sign up activity
    this.authService.createUserActivity({
      kind: UserActivityKindEnum.SIGN_UP,
      userId,
      ...client
    })

    // @discard
    // @Refactor at 17 Jan 2022
    // Create a team for every new user
    //
    // @Refactor at 5 May 2022
    // Attach a 14 days free trial Business Plan to newly created team
    //
    // @Discard at 8 Sep 2022
    // User have to manually create workspace and choose whether to trial for Premium plan
    //
    // const teamId = await this.authService.createTeam(
    //   userId,
    //   input.email,
    //   input.name
    // )
    // await this.projectService.createByNewTeam(teamId, userId, input.name)

    await this.authService.login({
      res,
      userId,
      deviceId: client.deviceId
    })

    return true
  }
}
