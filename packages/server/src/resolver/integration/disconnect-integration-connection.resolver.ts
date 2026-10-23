import { BadRequestException } from '@nestjs/common'

import { Auth, Team, TeamGuard, User } from '@decorator'
import { IntegrationConnectionInput } from '@graphql'
import { TeamModel, UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { IntegrationAuthService, IntegrationConnectionService } from '@service'

@Resolver()
@Auth()
export class DisconnectIntegrationConnectionResolver {
  constructor(
    private readonly connectionService: IntegrationConnectionService,
    private readonly integrationAuthService: IntegrationAuthService
  ) {}

  @Mutation(returns => Boolean)
  @TeamGuard()
  async disconnectIntegrationConnection(
    @User() user: UserModel,
    @Team() team: TeamModel,
    @Args('input') input: IntegrationConnectionInput
  ): Promise<boolean> {
    const connection = await this.connectionService.findById(input.connectionId)

    if (!connection) {
      throw new BadRequestException('The account does not exist')
    }

    await this.integrationAuthService.disconnectConnection(connection, user.id, {
      id: team.id,
      ownerId: team.ownerId
    })

    return true
  }
}
