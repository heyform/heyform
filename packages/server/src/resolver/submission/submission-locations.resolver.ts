import { Auth, FormGuard } from '@decorator'
import { SubmissionLocationsInput, SubmissionLocationType } from '@graphql'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { SubmissionService } from '@service'

@Resolver()
@Auth()
export class SubmissionLocationsResolver {
  constructor(private readonly submissionService: SubmissionService) {}

  @Query(returns => [SubmissionLocationType])
  @FormGuard()
  async submissionLocations(
    @Args('input') input: SubmissionLocationsInput
  ): Promise<SubmissionLocationType[]> {
    return this.submissionService.findLocations(
      input.formId,
      input.start,
      input.end
    )
  }
}
