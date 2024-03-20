import { BadRequestException } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'

import { AppDetailInput, AppType } from '@graphql'
import { AppModel, AppStatusEnum } from '@model'
import { AppService } from '@service'

@Resolver()
export class AppDetailResolver {
  constructor(private readonly appService: AppService) {}

  @Query(returns => AppType)
  async appDetail(@Args('input') input: AppDetailInput): Promise<AppModel> {
    const app = await this.appService.findByClientId(input.clientId)

    if (!app || app.status !== AppStatusEnum.ACTIVE) {
      throw new BadRequestException('Invalid app authorization parameters')
    }

    const appRedirectUri = app.config.get('redirectUri')

    if (!input.redirectUri.startsWith(appRedirectUri)) {
      throw new BadRequestException('Invalid app redirect uri')
    }

    return app
  }
}
