import { BadRequestException, UseGuards } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'

import { helper } from '@heyform-inc/utils'

import { GraphqlRequest, GraphqlResponse } from '@decorator'
import { LoginInput } from '@graphql'
import { BrowserIdGuard } from '@guard'
import { AuthService, UserService } from '@service'
import { GqlClient, comparePassword } from '@utils'
import { ClientInfo } from '@utils'

@Resolver()
@UseGuards(BrowserIdGuard)
export class LoginResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
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

    await this.authService.login({
      res,
      userId: user.id,
      browserId: client.browserId
    })

    return true
  }
}
