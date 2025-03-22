import { Auth, Team, TeamGuard, User } from '@decorator'
import { UpdateTeamInput } from '@graphql'
import { helper, pickValidValues } from '@heyform-inc/utils'
import { TeamModel, UserModel } from '@model'
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
    @User() user: UserModel,
    @Team() team: TeamModel,
    @Args('input') input: UpdateTeamInput
  ): Promise<boolean> {
    if (!team.isOwner) {
      throw new BadRequestException(
        "You don't have permission to change the workspace settings"
      )
    }

    let updates: Record<string, any> = pickValidValues(input as any, [
      'name',
      'avatar'
    ])

    // Only Pro, Ultimate Plan can custom domain
    if (!helper.isNil(input.enableCustomDomain)) {
      if (!team.plan.customDomain) {
        throw new BadRequestException('Upgrade your plan to add custom domain')
      }

      updates = {
        ...updates,
        enableCustomDomain: input.enableCustomDomain
      }
    }

    // Only Ultimate Plan can remove branding
    if (!helper.isNil(input.removeBranding)) {
      if (!team.plan.whitelabelBranding) {
        throw new BadRequestException('Upgrade your plan to remove branding')
      }

      updates.removeBranding = input.removeBranding
    }

    return await this.teamService.update(input.teamId, updates)
  }
}
