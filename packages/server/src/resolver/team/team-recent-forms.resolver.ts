import { Auth, Team, TeamGuard, User } from '@decorator'
import { FormType, RecentFormsInput } from '@graphql'
import { date, helper } from '@heyform-inc/utils'
import { FormModel, TeamModel, UserModel } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { FormService, ProjectService, SubmissionService } from '@service'

const DEFAULT_FORM_NAME = 'Untitled'

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
    const projects = await this.projectService.findAccessibleInTeams(user.id, [team])
    const projectIds = projects.map(project => project.id)
    const forms = await this.formService.findRecentInTeam(team.id, projectIds, input.limit)

    if (helper.isEmpty(forms)) {
      return []
    }

    const countMap = await this.submissionService.countInForms(forms.map(form => form.id))

    return forms.map(form => {
      //@ts-ignore
      form.updatedAt = date(form.get('updatedAt')).unix()

      //@ts-ignore
      form.submissionCount = countMap.find(row => row._id === form.id)?.count ?? 0

      if (helper.isEmpty(form.name)) {
        form.name = DEFAULT_FORM_NAME
      }

      return form
    })
  }
}
