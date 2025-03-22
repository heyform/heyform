import { Auth, FormGuard } from '@decorator'
import { UpdateFormVariablesInput } from '@graphql'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormService } from '@service'

@Resolver()
@Auth()
export class UpdateFormVariablesResolver {
  constructor(private readonly formService: FormService) {}

  /**
   * Update form variables
   */
  @Mutation(returns => Boolean)
  @FormGuard()
  async updateFormVariables(
    @Args('input') input: UpdateFormVariablesInput
  ): Promise<boolean> {
    return this.formService.update(input.formId, {
      variables: input.variables
    })
  }
}
