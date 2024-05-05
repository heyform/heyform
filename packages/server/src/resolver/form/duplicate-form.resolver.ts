import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { pickValidValues } from '@heyform-inc/utils'

import { Auth, Form, FormGuard, User } from '@decorator'
import { FormDetailInput } from '@graphql'
import { FormModel, UserModel } from '@model'
import { FormService } from '@service'

@Resolver()
@Auth()
export class DuplicateFormResolver {
  constructor(private readonly formService: FormService) {}

  /**
   * Create form
   */
  @Mutation(returns => String)
  @FormGuard()
  async duplicateForm(
    @User() user: UserModel,
    @Form() form: FormModel,
    @Args('input') input: FormDetailInput
  ): Promise<string> {
    const fields = [
      'variables',
      'logics',
      'translations',
      'hiddenFields',
      'fields',
      'kind',
      'interactiveMode',
      'settings',
      'teamId',
      'projectId',
      'themeSettings',
      'fieldUpdateAt'
    ]
    const newForm = pickValidValues(form as any, fields)

    newForm.memberId = user.id
    newForm.name = `${form.name} (copy)`

    return await this.formService.create(newForm)
  }
}
