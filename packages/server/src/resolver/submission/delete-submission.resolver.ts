import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { Auth, FormGuard } from '@decorator'
import { DeleteSubmissionInput } from '@graphql'
import { SubmissionService } from '@service'

@Resolver()
@Auth()
export class DeleteSubmissionResolver {
  constructor(private readonly submissionService: SubmissionService) {}

  /**
   * Delete submissions
   *
   * @param input
   */
  @Mutation(returns => Boolean)
  @FormGuard()
  async deleteSubmissions(@Args('input') input: DeleteSubmissionInput): Promise<boolean> {
    return this.submissionService.deleteByIds(input.formId, input.submissionIds)
  }
}
