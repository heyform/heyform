import { BadRequestException } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'

import { Auth, Team, TeamGuard, User } from '@decorator'
import { TeamDetailInput } from '@graphql'
import { TeamModel, UserModel } from '@model'
import { AuthService, MailService } from '@service'

@Resolver()
@Auth()
export class DissolveTeamCodeResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly mailService: MailService
  ) {}

  @Query(returns => Boolean)
  @TeamGuard()
  async dissolveTeamCode(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: TeamDetailInput
  ): Promise<boolean> {
    if (!team.isOwner) {
      throw new BadRequestException("You don't have permission to dissolve workspace")
    }

    // Add a code of dissolve team to cache
    const key = `verify_dissolve_team:${team.id}`
    const code = await this.authService.getVerificationCode(key)

    this.mailService.teamDeletionRequest(user.email, {
      teamName: team.name,
      code
    })

    return true
  }
}
