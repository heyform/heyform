import { BadRequestException, UseGuards } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'

import { helper } from '@heyform-inc/utils'

import { GraphqlRequest, GraphqlResponse } from '@decorator'
import { APP_DISABLE_REGISTRATION, BCRYPT_SALT, VERIFY_USER_EMAIL } from '@environments'
import { SignUpInput } from '@graphql'
import { BrowserIdGuard } from '@guard'
import { AuthService, UserService } from '@service'
import { GqlClient, gravatar, passwordHash } from '@utils'
import { ClientInfo } from '@utils'
import { isDisposableEmail } from '@utils'

@Resolver()
@UseGuards(BrowserIdGuard)
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
    if (APP_DISABLE_REGISTRATION) {
      throw new BadRequestException('Error: Registration is disabled')
    }

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
      // Setup SMTP if you want to verify user's email address
      isEmailVerified: !VERIFY_USER_EMAIL
    })

    await this.authService.login({
      res,
      userId,
      browserId: client.browserId
    })

    return true
  }
}
