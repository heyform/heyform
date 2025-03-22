import { Auth, FormGuard } from '@decorator'
import { GithubAssigneesInput } from '@graphql'
import { Github } from '@heyforms/integrations'
import { helper } from '@heyform-inc/utils'
import { BadGatewayException } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationService, ThirdPartyService } from '@service'

@Resolver()
@Auth()
export class GithubLabelsResolver {
  constructor(
    private readonly thirdPartyService: ThirdPartyService,
    private readonly integrationService: IntegrationService,
    private readonly appService: AppService
  ) {}

  @Query(returns => [String])
  @FormGuard()
  async githubLabels(
    @Args('input') input: GithubAssigneesInput
  ): Promise<string[]> {
    const integration = await this.integrationService.findOne(
      input.formId,
      input.appId
    )
    if (!integration || helper.isEmpty(integration.thirdPartyOauthId)) {
      throw new BadGatewayException('Please connect a new account with Github')
    }

    const thirdPartyOauth = await this.thirdPartyService.findById(
      integration.thirdPartyOauthId
    )
    if (!thirdPartyOauth || helper.isEmpty(thirdPartyOauth.tokens)) {
      throw new BadGatewayException('Please connect a new account with Github')
    }

    const app = await this.appService.findById(input.appId)
    const github = Github.init({
      clientId: app.clientId,
      clientSecret: app.clientSecret,
      tokens: thirdPartyOauth.tokens as any
    })
    return github.labels(input.repository)
  }
}
