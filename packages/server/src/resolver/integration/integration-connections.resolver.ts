import { Auth, Form, FormGuard } from '@decorator'
import { IntegrationConnectionType, IntegrationInput } from '@graphql'
import { FormModel } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { AppService, IntegrationAuthService, UserService } from '@service'

/**
 * The accounts a form's integration can deliver with: every connection of the
 * form's team to the app's provider, whoever connected it.
 */
@Resolver()
@Auth()
export class IntegrationConnectionsResolver {
  constructor(
    private readonly appService: AppService,
    private readonly integrationAuthService: IntegrationAuthService,
    private readonly userService: UserService
  ) {}

  @Query(returns => [IntegrationConnectionType])
  @FormGuard()
  async integrationConnections(
    @Args('input') input: IntegrationInput,
    @Form() form: FormModel
  ): Promise<IntegrationConnectionType[]> {
    const app = this.appService.findById(input.appId)

    if (!app || app.auth.type !== 'oauth2' || !this.appService.isAvailable(app)) {
      return []
    }

    const connections = await this.integrationAuthService.findTeamConnections(app, form.teamId)
    const users = await this.userService.findAll([...new Set(connections.map(c => c.createdBy))])

    return connections.map(connection => ({
      id: connection.id,
      provider: connection.provider,
      providerName: this.appService.providers[connection.provider]?.name ?? connection.provider,
      accountEmail: connection.accountEmail,
      accountName: connection.accountName,
      connectedBy: users.find(user => user.id === connection.createdBy)?.name,
      status: connection.status,
      statusReason: connection.statusReason,
      hasScopes: this.integrationAuthService.coversScopes(app, connection)
    }))
  }
}
