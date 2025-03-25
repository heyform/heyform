import { Auth, Team, TeamGuard } from '@decorator'
import { AddCustomDomainInput } from '@graphql'
import { TeamModel } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { CustomDomainService } from '@service'

@Resolver()
@Auth()
export class AddCustomDomainResolver {
  constructor(private readonly customDomainService: CustomDomainService) {}

  @Mutation(returns => Boolean)
  @TeamGuard()
  async addCustomDomain(
    @Team() team: TeamModel,
    @Args('input') input: AddCustomDomainInput
  ): Promise<boolean> {
    if (!team.isOwner) {
      throw new BadRequestException(
        "You don't have permission to add custom domains"
      )
    }

    // Only Pro, Ultimate Plan can custom domain
    // if (!team.plan.customDomain) {
    //   throw new BadRequestException('Upgrade your plan to add custom domain')
    // }

    const domain = input.domain.toLowerCase().trim()
    const existed = await this.customDomainService.findByDomain(domain)

    if (existed && existed.teamId !== team.id) {
      throw new BadRequestException('The custom domain already exists')
    }

    const isValidated = await this.customDomainService.validateDNSRecords(
      domain
    )

    if (!isValidated) {
      return false
    }

    // Update caddy route config
    await this.customDomainService.createOrUpdateRoute(
      team.id,
      domain,
      existed?.domain
    )

    if (existed) {
      return this.customDomainService.update(existed.id, {
        domain,
        active: true
      })
    } else {
      return this.customDomainService.create({
        domain,
        teamId: team.id,
        active: true
      })
    }
  }
}
