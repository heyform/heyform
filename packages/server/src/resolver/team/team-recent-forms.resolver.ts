import { Args, Query, Resolver } from '@nestjs/graphql'
import { Auth, Team, TeamGuard, User } from '@decorator'
import { FormService, ProjectService, SubmissionService } from '@service'
import { FormType, RecentFormsInput } from '@graphql'
import { FormModel, TeamModel, UserModel } from '@model'
import { date, helper } from '@heyform-inc/utils'

@Resolver()
@Auth()
export class TeamRecentFormsResolver {
  constructor(
    private readonly projectService: ProjectService,
    private readonly formService: FormService,
    private readonly submissionService: SubmissionService
  ) {}

  @Query(returns => [FormType])
  @TeamGuard()
  async teamRecentForms(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: RecentFormsInput
  ): Promise<FormModel[]> {
    const projectIds = await this.projectService.findProjectsByMemberId(user.id)
    const forms = await this.formService.findRecentInTeam(
      team.id,
      projectIds,
      input.limit
    )

    if (helper.isEmpty(forms)) {
      return []
    }

    const countMap = await this.submissionService.countInForms(
      forms.map(form => form.id)
    )

    return forms.map(form => {
      //@ts-ignore
      form.updatedAt = date(form.get('updatedAt')).unix()

      // @ts-ignore
      form.submissionCount =
        countMap.find(row => row._id === form.id)?.count ?? 0

      return form
    })
  }
}
