import { Auth, Form, FormGuard } from '@decorator'
import { FormDetailInput } from '@graphql'
import { FormStatusEnum } from '@heyform-inc/shared-types-enums'
import { FormModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormService } from '@service'

@Resolver()
@Auth()
export class RestoreFormResolver {
  constructor(private readonly formService: FormService) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async restoreForm(
    @Form() form: FormModel,
    @Args('input') input: FormDetailInput
  ): Promise<boolean> {
    return this.formService.update(input.formId, {
      retentionAt: -1,
      status: FormStatusEnum.NORMAL
    })
  }
}
