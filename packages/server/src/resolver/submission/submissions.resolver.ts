import { Args, Query, Resolver } from '@nestjs/graphql'

import { Auth, FormGuard, Team } from '@decorator'
import { SubmissionsInput, SubmissionsType } from '@graphql'
import { TeamModel } from '@model'
import { SubmissionService } from '@service'

@Resolver()
@Auth()
export class SubmissionsResolver {
  constructor(private readonly submissionService: SubmissionService) {}

  @Query(returns => SubmissionsType)
  @FormGuard()
  async submissions(
    @Team() team: TeamModel,
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
        limit: input.limit
      })
    }

    return {
      total,
      submissions
    }
  }
}
