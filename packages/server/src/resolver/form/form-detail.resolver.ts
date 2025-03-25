import { Auth, FormGuard, Team } from '@decorator'
import { FormDetailInput, FormType } from '@graphql'
import { FormModel, TeamModel } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import {
  // FormCustomReportService,
  FormService,
  SubmissionService
} from '@service'
import { date } from '@heyform-inc/utils'

@Resolver()
@Auth()
export class FormDetailResolver {
  constructor(
    private readonly formService: FormService,
    private readonly submissionService: SubmissionService // private readonly formCustomReportService: FormCustomReportService
  ) {}

  /**
   * Detail of the form
   *
   * @param input
   */
  @Query(returns => FormType)
  @FormGuard()
  async formDetail(
    @Team() team: TeamModel,
    @Args('input') input: FormDetailInput
  ): Promise<FormModel> {
    const [form, submissionCount, customReport] = await Promise.all([
      this.formService.findById(input.formId),
      this.submissionService.count({ formId: input.formId }),
      null
    ])

    //@ts-ignore
    form.updatedAt = date(form.get('updatedAt')).unix()

    // @ts-ignore
    form.submissionCount = submissionCount

    // @ts-ignore
    form.customReport = customReport

    return form
  }
}
