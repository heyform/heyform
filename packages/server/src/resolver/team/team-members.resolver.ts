import { Args, Query, Resolver } from '@nestjs/graphql'

import { helper } from '@heyform-inc/utils'

import { Auth, Team, TeamGuard, User } from '@decorator'
import { TeamDetailInput, TeamMemberType } from '@graphql'
import { TeamModel, UserModel } from '@model'
import { TeamService, UserService } from '@service'

@Resolver()
@Auth()
export class TeamMembersResolver {
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
    const members = await this.teamService.findMembersInTeam(input.teamId)

    if (helper.isEmpty(members)) {
      return []
    }

    const users = await this.userService.findAll(members.map(member => member.memberId))

    return users.map(user => {
      const member = members.find(member => member.memberId === user.id)

      // @ts-ignore
      user.role = member.role
      // @ts-ignore
      user.lastSeenAt = member.lastSeenAt
      // @ts-ignore
      user.isOwner = user.id === team.ownerId

      return user
    })
  }
}
