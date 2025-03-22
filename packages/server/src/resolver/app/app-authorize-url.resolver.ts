/**
 * Created by jiangwei on 2020/11/22.
 * Copyright (c) 2020 Heyooo, Inc. all rights reserved
 */
import { Auth, User } from '@decorator'
import { AppAuthorizeUrlInput } from '@graphql'
import { UserModel } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { AppService } from '@service'
import { buildUrlQuery } from '@utils'

@Resolver()
@Auth()
export class AppAuthorizeUrlResolver {
  constructor(private readonly appService: AppService) {}

  @Query(returns => String)
  async appAuthorizeUrl(
    @User() user: UserModel,
    @Args('input') input: AppAuthorizeUrlInput
  ): Promise<String> {
    const app = await this.appService.findByClientId(input.clientId)

    if (!app) {
      throw new BadRequestException('Invalid app authorization parameters')
    }

    const redirectUri = app.config.get('redirectUri')

    if (!input.redirectUri.startsWith(redirectUri)) {
      throw new BadRequestException('Invalid app redirect uri')
    }

    const code = await this.appService.createCode({
      appId: app.id,
      userId: user.id,
      redirectUri: input.redirectUri
    })

    return buildUrlQuery(input.redirectUri, {
      code,
      state: input.state
    })
  }
}
