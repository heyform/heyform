import { Auth, FormGuard } from '@decorator'
import { GithubOrganizationType, ThirdPartyInput } from '@graphql'
import { Github } from '@heyforms/integrations'
import { GithubOrganization } from '@heyforms/integrations'
import { helper } from '@heyform-inc/utils'
import { BadGatewayException } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationService, ThirdPartyService } from '@service'

@Resolver()
@Auth()
export class GithubOrganizationsResolver {
  constructor(
    private readonly thirdPartyService: ThirdPartyService,
    private readonly integrationService: IntegrationService,
    private readonly appService: AppService
  ) {}

  @Query(returns => [GithubOrganizationType])
  @FormGuard()
  async githubOrganizations(
    @Args('input') input: ThirdPartyInput
  ): Promise<GithubOrganization[]> {
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

    const organizations: GithubOrganization[] = [
      {
        login: thirdPartyOauth.user.get('login'),
        organization: false
      }
    ]
    const result = await github.organizations()

    return [...organizations, ...result]
  }
}
