import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { timestamp } from '@heyform-inc/utils'

import { Auth, FormGuard } from '@decorator'
import { UpdateFormSchemasInput } from '@graphql'
import { FormService } from '@service'

@Resolver()
@Auth()
export class UpdateFormSchemasResolver {
  constructor(private readonly formService: FormService) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async updateFormSchemas(@Args('input') input: UpdateFormSchemasInput): Promise<boolean> {
    return this.formService.update(input.formId, {
      fields: input.fields,
      fieldUpdateAt: timestamp()
    })
  }
}
