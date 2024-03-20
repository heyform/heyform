import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { Auth, FormGuard } from '@decorator'
import { UpdateFormArchiveInput } from '@graphql'
import { FormService } from '@service'

@Resolver()
@Auth()
export class FormArchiveResolver {
  constructor(private readonly formService: FormService) {}

  /**
   * Update form archive
   * and delete all submission if user disable archive
   *
   * @param input
   */
  @Mutation(returns => Boolean)
  @FormGuard()
  async formArchive(@Args('input') input: UpdateFormArchiveInput): Promise<boolean> {
    // Delete all submission once user disable archive
    if (!input.allowArchive) {
    }

    return await this.formService.update(input.formId, {
      'settings.allowArchive': input.allowArchive
    })
  }
}
