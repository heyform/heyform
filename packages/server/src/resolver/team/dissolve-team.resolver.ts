import { FormStatusEnum } from '@heyform-inc/shared-types-enums'
import { BadRequestException } from '@nestjs/common'

import { Auth, Team, TeamGuard, User } from '@decorator'
import { DissolveTeamInput } from '@graphql'
import { TeamModel, UserModel, isTeamOwner } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { AuthService, FormService, MailService, SubmissionService, TeamService } from '@service'

@Resolver()
@Auth()
export class DissolveTeamResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly teamService: TeamService,
    private readonly formService: FormService,
    private readonly submissionService: SubmissionService,
    private readonly mailService: MailService
  ) {}

  @Mutation(returns => Boolean)
  @TeamGuard()
  async dissolveTeam(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: DissolveTeamInput
  ): Promise<boolean> {
    await this.teamService.withMembershipLock(team.id, async () => {
      const currentTeam = await this.teamService.findById(team.id)
      if (!currentTeam || !isTeamOwner(currentTeam, user.id)) {
        throw new BadRequestException("You don't have permission to dissolve workspace")
      }

      const attemptsKey = `limit:dissolve_team:${team.id}`

      await this.authService.attemptsCheck(attemptsKey, async () => {
        const key = `verify_dissolve_team:${team.id}:${user.id}`
        await this.authService.checkVerificationCode(key, input.code)
      })

      const forms = await this.formService.findAllInTeam(team.id)
      const formIds = forms.map(form => form.id)

      if (formIds.length > 0) {
        await this.formService.updateMany(formIds, {
          'settings.active': false,
          status: FormStatusEnum.TRASH
        })
        await this.submissionService.deleteAll(formIds)
        await this.formService.delete(formIds)
      }

      await this.teamService.deleteAllMemberInTeam(team.id)
      await this.teamService.delete(team.id)
    })

    this.mailService.teamDeletionAlert(
      user.email,
      {
        teamName: team.name,
        userName: user.name
      },
      user.lang
    )

    return true
  }
}
