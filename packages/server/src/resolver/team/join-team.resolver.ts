import { BadRequestException, NotFoundException } from '@nestjs/common'

import { Auth, User } from '@decorator'
import { JoinTeamInput } from '@graphql'
import { TeamRoleEnum, UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { MailService, ProjectService, TeamService, UserService } from '@service'

@Resolver()
@Auth()
export class JoinTeamResolver {
  constructor(
    private readonly teamService: TeamService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly projectService: ProjectService
  ) {}

  @Mutation(returns => Boolean)
  async joinTeam(@User() user: UserModel, @Args('input') input: JoinTeamInput): Promise<boolean> {
    const team = await this.teamService.findById(input.teamId)

    if (!team) {
      throw new NotFoundException('The workspace does not exist')
    }

    const invitation = await this.teamService.findJoinableByInvite(input.teamId, input.inviteCode)

    if (!invitation && team.allowJoinByInviteLink) {
      throw new BadRequestException('The invitation code of the workspace does not match')
    }

    if (!invitation) {
      throw new BadRequestException('The workspace is not allowed to join')
    }

    const teamMember = await this.teamService.findMemberById(input.teamId, user.id)

    if (teamMember) {
      throw new BadRequestException("You've already joined the workspace")
    }

    await this.teamService.createMember({
      teamId: input.teamId,
      memberId: user.id,
      role: TeamRoleEnum.COLLABORATOR
    })

    // A member of the workspace who belongs to no project can see none of its forms, so a joiner
    // starts in the project the workspace was created with. Removing or leaving the workspace
    // already deletes the project memberships.
    const project = await this.projectService.findDefaultInTeam(input.teamId)

    if (project) {
      // A project can already name this member before they join the workspace
      const projectMember = await this.projectService.findMemberById(project.id, user.id)

      if (!projectMember) {
        await this.projectService.createMember({
          projectId: project.id,
          memberId: user.id
        })
      }
    }

    const teamOwner = await this.userService.findById(team.ownerId)

    this.mailService.joinWorkspaceAlert(teamOwner.email, {
      teamName: team.name,
      userName: `${user.name} (${user.email})`
    })

    return true
  }
}
