import { Auth, Team, TeamGuard, User } from '@decorator'
import { TeamDetailInput, TeamMemberType } from '@graphql'
import { helper } from '@heyform-inc/utils'
import { TeamModel, UserModel } from '@model'
import { Logger, gravatar } from '@utils'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { TeamService, UserService } from '@service'

@Resolver()
@Auth()
export class TeamMembersResolver {
  private readonly logger = new Logger(TeamMembersResolver.name)

  constructor(
    private readonly userService: UserService,
    private readonly teamService: TeamService
  ) {}

  @Query(returns => [TeamMemberType])
  @TeamGuard()
  async teamMembers(
    @User() user: UserModel,
    @Team() team: TeamModel,
    @Args('input') input: TeamDetailInput
  ): Promise<UserModel[]> {
    this.logger.log('teamMembers: loading workspace memberships')
    const members = await this.teamService.findMembersInTeam(input.teamId)

    this.logger.log('teamMembers: membership count=' + members.length)

    if (helper.isEmpty(members)) {
      return []
    }

    const users = await this.userService.findAll(members.map(member => member.memberId))

    this.logger.log('teamMembers: user count=' + users.length)

    const result = users.map(user => {
      const member = members.find(member => member.memberId === user.id)

      this.logger.log('teamMembers: matched membership=' + Boolean(member) + ', role=' + member?.role + ', lastSeenAt=' + member?.lastSeenAt)

      //@ts-ignore
      user.role = member.role
      //@ts-ignore
      user.lastSeenAt = member.lastSeenAt
      //@ts-ignore
      user.isOwner = user.id === team.ownerId

      if (!user.avatar && user.email) {
        user.avatar = gravatar(user.email)
      }

      return user
    })
    this.logger.log('teamMembers: returning ' + result.length + ' members')
    return result
  }
}
