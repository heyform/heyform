import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { Auth, FormGuard } from '@decorator'
import { FormService } from '@service'
import { DeleteHiddenFieldInput } from '@graphql'

@Resolver()
@Auth()
export class DeleteFormHiddenFieldResolver {
  constructor(private readonly formService: FormService) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async deleteFormHiddenField(@Args('input') input: DeleteHiddenFieldInput): Promise<boolean> {
    await this.formService.update(input.formId, {
      $pull: {
        hiddenFields: {
          id: input.fieldId
        }
      }
    })

    return true
  }
}
