import { Auth, FormGuard } from '@decorator'
import { UpdateFormLogicsInput } from '@graphql'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormService } from '@service'

@Resolver()
@Auth()
export class UpdateFormLogicsResolver {
  constructor(private readonly formService: FormService) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async updateFormLogics(@Args('input') input: UpdateFormLogicsInput): Promise<boolean> {
    return this.formService.update(input.formId, {
      draftLogics: input.logics
    })
  }
}
