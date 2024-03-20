import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { Auth, FormGuard } from '@decorator'
import { UpdateFormLogicsInput } from '@graphql'
import { FormService } from '@service'

@Resolver()
@Auth()
export class UpdateFormLogicsResolver {
  constructor(private readonly formService: FormService) {}

  /**
   * Update form logics
   */
  @Mutation(returns => Boolean)
  @FormGuard()
  async updateFormLogics(@Args('input') input: UpdateFormLogicsInput): Promise<boolean> {
    return this.formService.update(input.formId, {
      logics: input.logics
    })
  }
}
