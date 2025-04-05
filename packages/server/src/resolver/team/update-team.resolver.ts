import { Auth, Team, TeamGuard } from '@decorator'
import { UpdateTeamInput } from '@graphql'
import { helper, pickValidValues } from '@heyform-inc/utils'
import { TeamModel } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { TeamService } from '@service'

@Resolver()
@Auth()
export class UpdateTeamResolver {
  constructor(private readonly teamService: TeamService) {}

  @Mutation(returns => Boolean)
  @TeamGuard()
  async updateTeam(
    // @User() user: UserModel,
    @Team() team: TeamModel,
    @Args('input') input: UpdateTeamInput
  ): Promise<boolean> {
    if (!team.isOwner) {
      throw new BadRequestException(
        "You don't have permission to change the workspace settings"
      )
    }

    const updates: Record<string, any> = pickValidValues(input as any, [
      'name',
      'avatar'
    ])

    // Add custom AI configuration fields
    if (!helper.isNil(input.aiKey)) {
      updates.aiKey = input.aiKey
    }

    if (!helper.isNil(input.aiEndpoint)) {
      updates.aiEndpoint = input.aiEndpoint
    }

    if (!helper.isNil(input.aiModel)) {
      updates.aiModel = input.aiModel
    }

    // Only Ultimate Plan can remove branding
    if (!helper.isNil(input.removeBranding)) {
      // if (!team.plan.whitelabelBranding) {
      //   throw new BadRequestException('Upgrade your plan to remove branding')
      // }

      updates.removeBranding = input.removeBranding
    }

    return await this.teamService.update(input.teamId, updates)
  }
}
