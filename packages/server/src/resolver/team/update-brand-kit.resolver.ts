import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { Auth, Team, TeamGuard } from '@decorator'
import { TeamModel } from '@model'
import { UpdateBrandKitInput } from '@graphql'
import { BadRequestException } from '@nestjs/common'
import { BrandKitService } from '@service'
import { pickObject } from '@heyform-inc/utils'

@Resolver()
@Auth()
export class UpdateBrandKitResolver {
  constructor(private readonly brandKitService: BrandKitService) {}

  @Mutation(returns => Boolean)
  @TeamGuard()
  async updateBrandKit(
    @Team() team: TeamModel,
    @Args('input') input: UpdateBrandKitInput
  ): Promise<boolean> {
    if (!team.plan.whitelabelBranding) {
      throw new BadRequestException('Upgrade your plan to setup brand kit')
    }

    return this.brandKitService.update(
      input.teamId,
      pickObject(input, [], ['teamId'])
    )
  }
}
