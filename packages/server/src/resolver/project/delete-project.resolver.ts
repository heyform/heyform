import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { Auth, Project, ProjectGuard, Team, User } from '@decorator'
import { DeleteProjectInput } from '@graphql'
import { ProjectModel, TeamModel, UserModel } from '@model'
import { AuthService, MailService, ProjectService } from '@service'

@Resolver()
@Auth()
export class DeleteProjectResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly projectService: ProjectService,
    private readonly mailService: MailService
  ) {}

  @ProjectGuard()
  @Mutation(returns => Boolean)
  async deleteProject(
    @Team() team: TeamModel,
    @Project() project: ProjectModel,
    @User() user: UserModel,
    @Args('input') input: DeleteProjectInput
  ): Promise<boolean> {
    if (!team.isOwner) {
      throw new BadRequestException("You don't have permission to delete the project")
    }

    // Check if dissolve team is exceeded
    const attemptsKey = `limit:delete_project:${project.id}`

    await this.authService.attemptsCheck(attemptsKey, async () => {
      const key = `verify_delete_project:${project.id}`
      await this.authService.checkVerificationCode(key, input.code)
    })

    await this.projectService.delete(input.projectId)

    this.mailService.projectDeletionAlert(user.email, {
      teamName: team.name,
      projectName: project.name,
      userName: user.name
    })

    return true
  }
}
