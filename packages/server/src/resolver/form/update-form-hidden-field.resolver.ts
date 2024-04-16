import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { Auth, FormGuard } from '@decorator'
import { FormService } from '@service'
import { CreateHiddenFieldInput } from '@graphql'

@Resolver()
@Auth()
export class UpdateFormHiddenFieldResolver {
  constructor(private readonly formService: FormService) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async updateFormHiddenField(@Args('input') input: CreateHiddenFieldInput): Promise<boolean> {
    await this.formService.update(
      input.formId,
      {
        $set: {
          'hiddenFields.$.name': input.fieldName
        }
      },
      {
        'hiddenFields.id': input.fieldId
      }
    )

    return true
  }
}
