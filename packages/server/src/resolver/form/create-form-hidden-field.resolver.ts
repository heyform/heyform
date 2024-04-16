import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { Auth, FormGuard } from '@decorator'
import { FormService } from '@service'
import { CreateHiddenFieldInput } from '@graphql'

@Resolver()
@Auth()
export class CreateFormHiddenFieldResolver {
  constructor(private readonly formService: FormService) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async createFormHiddenField(@Args('input') input: CreateHiddenFieldInput): Promise<boolean> {
    await this.formService.update(input.formId, {
      $push: {
        hiddenFields: {
          id: input.fieldId,
          name: input.fieldName
        }
      }
    })

    return true
  }
}
