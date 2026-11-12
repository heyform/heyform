import { Auth, FormGuard } from '@decorator'
import { FormDetailInput } from '@graphql'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormService, SubmissionService } from '@service'

@Resolver()
@Auth()
export class DeleteFormResolver {
  constructor(
    private readonly formService: FormService,
    private readonly submissionService: SubmissionService
  ) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async deleteForm(@Args('input') input: FormDetailInput): Promise<boolean> {
    // Only a form in the trash is deleted. One that stays keeps its submissions.
    if (await this.formService.delete(input.formId)) {
      await this.submissionService.deleteAll(input.formId)
    }

    return true
  }
}
