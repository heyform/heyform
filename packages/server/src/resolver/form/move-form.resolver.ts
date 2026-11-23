import { Auth, FormGuard, Team, User } from '@decorator'
import { MoveFormInput } from '@graphql'
import { TeamModel, UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormService, ProjectService } from '@service'

@Resolver()
@Auth()
export class MoveFormResolver {
  constructor(
    private readonly projectService: ProjectService,
    private readonly formService: FormService
  ) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async moveForm(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: MoveFormInput
  ): Promise<boolean> {
    const project = await this.projectService.findOne({
      _id: input.targetProjectId,
      teamId: team.id
    })

    if (
      project &&
      (team.isOwner || (await this.projectService.findMemberById(project.id, user.id)))
    ) {
      return this.formService.update(input.formId, {
        projectId: input.targetProjectId
      })
    }

    return false
  }
}
