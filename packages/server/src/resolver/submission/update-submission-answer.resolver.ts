import { BadRequestException } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { Answer } from '@heyform-inc/shared-types-enums'

import { Auth, FormGuard } from '@decorator'
import { UpdateSubmissionAnswerInput } from '@graphql'
import { SubmissionService } from '@service'

@Resolver()
@Auth()
export class UpdateSubmissionAnswerResolver {
  constructor(private readonly submissionService: SubmissionService) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async updateSubmissionAnswer(
    @Args('input') input: UpdateSubmissionAnswerInput
  ): Promise<boolean> {
    const submission = await this.submissionService.findByFormId(input.formId, input.submissionId)

    if (!submission) {
      throw new BadRequestException('The submission dose not exist.')
    }

    const existsAnswer = submission.answers.find(row => row.id === input.answer.id)

    if (existsAnswer) {
      return this.submissionService.updateAnswer(input.submissionId, input.answer as Answer)
    } else {
      return this.submissionService.createAnswer(input.submissionId, input.answer as Answer)
    }
  }
}
