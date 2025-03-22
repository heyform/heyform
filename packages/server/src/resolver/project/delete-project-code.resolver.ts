import { Auth, Project, ProjectGuard, Team, User } from '@decorator'
import { ProjectDetailInput } from '@graphql'
import { ProjectModel, TeamModel, UserModel } from '@model'
import { BadRequestException } from '@nestjs/common'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { AuthService, MailService } from '@service'

@Resolver()
@Auth()
export class DeleteProjectCodeResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly mailService: MailService
  ) {}

  @ProjectGuard()
  @Query(returns => Boolean)
  async deleteProjectCode(
    @Team() team: TeamModel,
    @Project() project: ProjectModel,
    @User() user: UserModel,
    @Args('input') input: ProjectDetailInput
  ): Promise<boolean> {
    if (!team.isOwner) {
      throw new BadRequestException(
        "You don't have permission to delete the project"
      )
    }

    // Add a code of dissolve team to cache
    const key = `verify_delete_project:${project.id}`
    const code = await this.authService.getVerificationCode(key)

    this.mailService.projectDeletionRequest(user.email, {
      teamName: team.name,
      projectName: project.name,
      code
    })

    return true
  }
}
