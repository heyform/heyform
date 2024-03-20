import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { FormField } from '@heyform-inc/shared-types-enums'

import { Auth, FormGuard } from '@decorator'
import { CreateFormFieldInput } from '@graphql'
import { FormService } from '@service'

@Resolver()
@Auth()
export class CreateFormFieldResolver {
  constructor(private readonly formService: FormService) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async createFormField(@Args('input') input: CreateFormFieldInput): Promise<boolean> {
    return this.formService.createField(input.formId, input.field as FormField)
  }
}
