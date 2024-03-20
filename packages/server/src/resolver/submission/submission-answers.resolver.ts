import { Args, Query, Resolver } from '@nestjs/graphql'

import { Auth, FormGuard, Team } from '@decorator'
import { SubmissionAnswersInput, SubmissionAnswersType } from '@graphql'
import { TeamModel } from '@model'
import { SubmissionService } from '@service'

@Resolver()
@Auth()
export class SubmissionAnswersResolver {
  constructor(private readonly submissionService: SubmissionService) {}

  @Query(returns => SubmissionAnswersType)
  @FormGuard()
  async submissionAnswers(
    @Team() team: TeamModel,
    @Args('input') input: SubmissionAnswersInput
  ): Promise<SubmissionAnswersType> {
    const total = await this.submissionService.countAllWithFieldId(input.formId, input.fieldId)
    let answers: any[] = []

    if (total > 0) {
      answers = await this.submissionService.findAllWithFieldId(
        input.formId,
        input.fieldId,
        input.page,
        input.limit
      )

      answers = answers.map(row => {
        return {
          submissionId: row.id,
          kind: row.answers[0].kind,
          value: row.answers[0].value,
          endAt: row.endAt
        }
      })
    }

    return {
      total,
      answers
    }
  }
}
