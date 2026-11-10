import { BadRequestException, ForbiddenException, UseGuards } from '@nestjs/common'

import { COOKIE_INVITATION_NAME, CookieOptionsFactory } from '@config'
import { GraphqlResponse } from '@decorator'
import {
  APP_DISABLE_REGISTRATION,
  BCRYPT_SALT,
  DISABLE_LOGIN_WITH_PASSWORD,
  VERIFY_USER_EMAIL
} from '@environments'
import { SignUpInput } from '@graphql'
import { DeviceIdGuard } from '@guard'
import { helper } from '@heyform-inc/utils'
import { TeamModel, TeamRoleEnum, UserActivityKindEnum } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { AuthService, MailService, ProjectService, TeamService, UserService } from '@service'
import { ClientInfo, GqlClient, gravatar, isDuplicateEmailError, passwordHash } from '@utils'
import { isDisposableEmail } from '@utils'

const EMAIL_TAKEN = 'The email address already exist'

@Resolver()
@UseGuards(DeviceIdGuard)
export class SignUpResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly teamService: TeamService,
    private readonly projectService: ProjectService
  ) {}

  @Mutation(returns => Boolean)
  async signUp(
    @GqlClient() client: ClientInfo,
    @GraphqlResponse() res: any,
    @Args('input') input: SignUpInput
  ): Promise<boolean> {
    if (DISABLE_LOGIN_WITH_PASSWORD) {
      throw new ForbiddenException('Password registration is disabled.')
    }

    const invitation = await this.findInvitation(input)

    if (APP_DISABLE_REGISTRATION && !invitation) {
      throw new BadRequestException('Error: Registration is disabled')
    }

    if (isDisposableEmail(input.email)) {
      throw new BadRequestException(
        'Error: Disposable email address detected, please use a work email to create the account'
      )
    }

    const existUser = await this.userService.findByEmail(input.email)

    if (helper.isValid(existUser)) {
      throw new BadRequestException(EMAIL_TAKEN)
    }

    let userId: string | undefined

    try {
      userId = await this.userService.create({
        name: input.name,
        email: input.email,
        password: await passwordHash(input.password, BCRYPT_SALT),
        avatar: gravatar(input.email),
        lang: client.lang,
        isEmailVerified: !VERIFY_USER_EMAIL
      })
    } catch (error) {
      // Another sign-up or login took the address after the check above
      if (isDuplicateEmailError(error)) {
        throw new BadRequestException(EMAIL_TAKEN)
      }

      throw error
    }

    if (invitation) {
      try {
        await this.teamService.createMember({
          teamId: invitation.id,
          memberId: userId,
          role: TeamRoleEnum.COLLABORATOR
        })
      } catch (error) {
        await this.userService.delete(userId)
        throw error
      }

      // After the rollback above, so a failure here can't leave a workspace member with no user
      await this.projectService.addMemberToDefaultProject(invitation.id, userId)

      const teamOwner = await this.userService.findById(invitation.ownerId)

      if (teamOwner) {
        this.mailService.joinWorkspaceAlert(teamOwner.email, {
          teamName: invitation.name,
          userName: `${input.name} (${input.email})`
        })
      }
    }

    this.authService.createUserActivity({
      kind: UserActivityKindEnum.SIGN_UP,
      userId,
      ...client
    })

    await this.authService.login({
      res,
      userId,
      deviceId: client.deviceId
    })

    if (VERIFY_USER_EMAIL) {
      const code = await this.authService.getVerificationCodeWithRateLimit(`verify_email:${userId}`)
      this.mailService.emailVerificationRequest(input.email, code, client.lang)
    }

    res.clearCookie(
      COOKIE_INVITATION_NAME,
      CookieOptionsFactory({
        maxAge: 0,
        path: '/'
      })
    )

    return true
  }

  private async findInvitation(input: SignUpInput): Promise<TeamModel | null> {
    const hasTeamId = helper.isValid(input.teamId)
    const hasInviteCode = helper.isValid(input.inviteCode)

    if (!hasTeamId && !hasInviteCode) {
      return null
    }

    if (!hasTeamId || !hasInviteCode) {
      throw new BadRequestException('The workspace invitation is invalid or expired')
    }

    const team = await this.teamService.findJoinableByInvite(input.teamId!, input.inviteCode!)

    if (!team) {
      throw new BadRequestException('The workspace invitation is invalid or expired')
    }

    return team
  }
}
