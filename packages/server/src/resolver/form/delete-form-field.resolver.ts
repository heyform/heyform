import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { Auth, FormGuard } from '@decorator'
import { DeleteFormFieldInput } from '@graphql'
import { FormService } from '@service'

@Resolver()
@Auth()
export class DeleteFormFieldResolver {
  constructor(private readonly formService: FormService) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async deleteFormField(@Args('input') input: DeleteFormFieldInput): Promise<boolean> {
    return this.formService.deleteField(input.formId, input.fieldId)
  }
}
