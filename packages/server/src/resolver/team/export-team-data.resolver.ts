/**
 * @program: serves
 * @description:
 * @author: mufeng
 * @date: 12/27/21 3:50 PM
 **/

import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { Auth, Team, TeamGuard } from '@decorator'
import { QueueService } from '@service'
import { TeamModel } from '@model'
import { BadRequestException } from '@nestjs/common'
import { TeamDetailInput } from '@graphql'

@Resolver()
@Auth()
export class ExportTeamDataResolver {
  constructor(private readonly queueService: QueueService) {}

  @Mutation(returns => Boolean)
  @TeamGuard()
  async exportTeamData(
    @Team() team: TeamModel,
    @Args('input') input: TeamDetailInput
  ): Promise<boolean> {
    if (!team.isOwner) {
      throw new BadRequestException(
        "You don't have permission to export workspace data"
      )
    }

    await this.queueService.addExportTeamDataQueue(team.id)
    return true
  }
}
