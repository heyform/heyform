import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { Auth, Team, TeamGuard } from '@decorator'
import { TeamModel } from '@model'
import { CreateBrandKitInput } from '@graphql'
import { BadRequestException } from '@nestjs/common'
import { BrandKitService } from '@service'

@Resolver()
@Auth()
export class CreateBrandKitResolver {
  constructor(private readonly brandKitService: BrandKitService) {}

  @Mutation(returns => String)
  @TeamGuard()
  async createBrandKit(
    @Team() team: TeamModel,
    @Args('input') input: CreateBrandKitInput
  ): Promise<string> {
    if (!team.plan.whitelabelBranding) {
      throw new BadRequestException('Upgrade your plan to setup brand kit')
    }

    const brandKit = await this.brandKitService.findByTeamId(team.id)

    if (brandKit) {
      return brandKit.id
    }

    return this.brandKitService.create({
      teamId: team.id,
      logo: input.logo,
      theme: input.theme
    })
  }
}
