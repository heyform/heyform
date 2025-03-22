/**
 * @program: servers
 * @description: Monday boards
 * @author: Mufeng
 * @date: 2021-06-29 10:19
 **/

import { Auth, FormGuard } from '@decorator'
import { MondayGroupsInput, MondayGroupType } from '@graphql'
import { Monday } from '@heyforms/integrations'
import { helper } from '@heyform-inc/utils'
import { BadGatewayException } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationService, ThirdPartyService } from '@service'

@Resolver()
@Auth()
export class MondayGroupsResolver {
  constructor(
    private readonly thirdPartyService: ThirdPartyService,
    private readonly integrationService: IntegrationService,
    private readonly appService: AppService
  ) {}

  @Query(returns => [MondayGroupType])
  @FormGuard()
  async mondayGroups(@Args('input') input: MondayGroupsInput): Promise<any[]> {
    const integration = await this.integrationService.findOne(
      input.formId,
      input.appId
    )
    if (!integration || helper.isEmpty(integration.thirdPartyOauthId)) {
      throw new BadGatewayException('Please connect a new account with Monday')
    }

    const thirdPartyOauth = await this.thirdPartyService.findById(
      integration.thirdPartyOauthId
    )
    if (!thirdPartyOauth || helper.isEmpty(thirdPartyOauth.tokens)) {
      throw new BadGatewayException('Please connect a new account with Monday')
    }

    const app = await this.appService.findById(input.appId)
    const monday = Monday.init({
      clientId: app.clientId,
      clientSecret: app.clientSecret,
      tokens: thirdPartyOauth.tokens as any
    })
    return monday.groups(input.board)
  }
}
