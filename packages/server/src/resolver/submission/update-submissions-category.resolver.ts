import { Auth, FormGuard } from '@decorator'
import { UpdateSubmissionsCategoryInput } from '@graphql'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { SubmissionService } from '@service'

@Resolver()
@Auth()
export class UpdateSubmissionsCategoryResolver {
  constructor(private readonly submissionService: SubmissionService) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async updateSubmissionsCategory(
    @Args('input') input: UpdateSubmissionsCategoryInput
  ): Promise<boolean> {
    return this.submissionService.updateCategory(input)
  }
}
