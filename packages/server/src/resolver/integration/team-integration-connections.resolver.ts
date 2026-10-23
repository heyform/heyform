import { Auth, Team, TeamGuard, User } from '@decorator'
import { IntegrationConnectionType, TeamDetailInput } from '@graphql'
import { TeamModel, UserModel } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import {
  AppService,
  FormService,
  IntegrationConnectionService,
  IntegrationService,
  UserService
} from '@service'

// The accounts a team has connected, for its settings page
@Resolver()
@Auth()
export class TeamIntegrationConnectionsResolver {
  constructor(
    private readonly appService: AppService,
    private readonly connectionService: IntegrationConnectionService,
    private readonly integrationService: IntegrationService,
    private readonly formService: FormService,
    private readonly userService: UserService
  ) {}

  @Query(returns => [IntegrationConnectionType])
  @TeamGuard()
  async teamIntegrationConnections(
    @User() user: UserModel,
    @Team() team: TeamModel,
    @Args('input') input: TeamDetailInput
  ): Promise<IntegrationConnectionType[]> {
    const connections = await this.connectionService.findAllInTeam(team.id)

    if (!connections.length) {
      return []
    }

    const [integrations, users] = await Promise.all([
      this.integrationService.findAllByConnections(connections.map(c => c.id)),
      this.userService.findAll([...new Set(connections.map(c => c.createdBy))])
    ])
    const forms = await this.formService.findAllByIds([
      ...new Set(integrations.map(integration => integration.formId))
    ])

    return connections.map(connection => {
      const formIds = new Set(
        integrations
          .filter(integration => integration.connectionId === connection.id)
          .map(integration => integration.formId)
      )

      return {
        id: connection.id,
        provider: connection.provider,
        providerName: this.appService.providers[connection.provider]?.name ?? connection.provider,
        accountEmail: connection.accountEmail,
        accountName: connection.accountName,
        connectedBy: users.find(u => u.id === connection.createdBy)?.name,
        status: connection.status,
        statusReason: connection.statusReason,
        forms: forms
          .filter(form => formIds.has(form.id) && form.teamId === team.id)
          .map(form => ({ id: form.id, name: form.name })),
        canDisconnect: connection.createdBy === user.id || team.ownerId === user.id
      }
    })
  }
}
