/**
 * @program: servers
 * @description: Mailchimp audiences
 * @author: Mufeng
 * @date: 2021-06-15 10:19
 **/

import { Auth, FormGuard } from '@decorator'
import { MailchimpAudienceType, ThirdPartyInput } from '@graphql'
import { Mailchimp, MailchimpAudience } from '@heyforms/integrations'
import { helper } from '@heyform-inc/utils'
import { BadGatewayException } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationService, ThirdPartyService } from '@service'

@Resolver()
@Auth()
export class MailchimpAudiencesResolver {
  constructor(
    private readonly thirdPartyService: ThirdPartyService,
    private readonly integrationService: IntegrationService,
    private readonly appService: AppService
  ) {}

  @Query(returns => [MailchimpAudienceType])
  @FormGuard()
  async mailchimpAudiences(
    @Args('input') input: ThirdPartyInput
  ): Promise<MailchimpAudience[]> {
    const integration = await this.integrationService.findOne(
      input.formId,
      input.appId
    )
    if (!integration || helper.isEmpty(integration.thirdPartyOauthId)) {
      throw new BadGatewayException(
        'Please connect a new account with Mailchimp'
      )
    }

    const thirdPartyOauth = await this.thirdPartyService.findById(
      integration.thirdPartyOauthId
    )
    if (!thirdPartyOauth || helper.isEmpty(thirdPartyOauth.tokens)) {
      throw new BadGatewayException(
        'Please connect a new account with Mailchimp'
      )
    }

    const app = await this.appService.findById(input.appId)
    const mailchimp = Mailchimp.init({
      clientId: app.clientId,
      clientSecret: app.clientSecret,
      tokens: thirdPartyOauth.tokens as any
    })
    return mailchimp.audiences()
  }
}
