import { Auth, Form, FormGuard, Team } from '@decorator'
import { SubmissionsInput, SubmissionsType } from '@graphql'
import { FormModel, TeamModel } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { SubmissionService } from '@service'
import { isSubmissionIpVisible } from '@utils'

@Resolver()
@Auth()
export class SubmissionsResolver {
  constructor(private readonly submissionService: SubmissionService) {}

  @Query(returns => SubmissionsType)
  @FormGuard()
  async submissions(
    @Team() team: TeamModel,
    @Form() form: FormModel,
    @Args('input') input: SubmissionsInput
  ): Promise<SubmissionsType> {
    const total = await this.submissionService.count({
      formId: input.formId,
      category: input.category,
      labelId: input.labelId
    })

    let submissions: any[] = []

    if (total > 0) {
      submissions = await this.submissionService.findAll({
        formId: input.formId,
        category: input.category,
        labelId: input.labelId,
        page: input.page,
        limit: input.limit,
        withIp: isSubmissionIpVisible(form as any)
      })
    }

    return {
      total,
      submissions
    }
  }
}
