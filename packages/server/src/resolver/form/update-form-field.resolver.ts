import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { Auth, FormGuard } from '@decorator'
import { UpdateFormFieldInput } from '@graphql'
import { FormService } from '@service'

@Resolver()
@Auth()
export class UpdateFormFieldResolver {
  constructor(private readonly formService: FormService) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async updateFormField(@Args('input') input: UpdateFormFieldInput): Promise<boolean> {
    return this.formService.updateField(input)
  }
}
