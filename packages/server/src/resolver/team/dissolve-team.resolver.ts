import { Auth, Team, TeamGuard, User } from '@decorator'
import { DissolveTeamInput } from '@graphql'
import { TeamModel, UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import {
  AuthService,
  FormService,
  MailService,
  PaymentService,
  SubmissionService,
  TeamService
} from '@service'
import { BadRequestException } from '@nestjs/common'

@Resolver()
@Auth()
export class DissolveTeamResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly teamService: TeamService,
    private readonly formService: FormService,
    private readonly submissionService: SubmissionService,
    private readonly paymentService: PaymentService,
    private readonly mailService: MailService
  ) {}

  @Mutation(returns => Boolean)
  @TeamGuard()
  async dissolveTeam(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: DissolveTeamInput
  ): Promise<boolean> {
    if (!team.isOwner) {
      throw new BadRequestException(
        "You don't have permission to dissolve workspace"
      )
    }

    // Check if dissolve team is exceeded
    const attemptsKey = `limit:dissolve_team:${team.id}`

    await this.authService.attemptsCheck(attemptsKey, async () => {
      const key = `verify_dissolve_team:${team.id}`
      await this.authService.checkVerificationCode(key, input.code)
    })

    await this.paymentService.cancelSubscription(team.subscription.id)

    await this.teamService.delete(input.teamId)
    await this.teamService.deleteAllMemberInTeam(input.teamId)

    const forms = await this.formService.findAllInTeam(input.teamId)
    const formIds = forms.map(form => form.id)

    if (formIds.length > 0) {
      await this.formService.delete(formIds)
      await this.submissionService.deleteAll(formIds)
    }

    this.mailService.teamDeletionAlert(user.email, {
      teamName: team.name,
      userName: user.name
    })

    return true
  }
}
