import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { FormStatusEnum } from '@heyform-inc/shared-types-enums'
import { date } from '@heyform-inc/utils'

import { Auth, Form, FormGuard } from '@decorator'
import { FormDetailInput } from '@graphql'
import { FormModel } from '@model'
import { FormService } from '@service'

@Resolver()
@Auth()
export class MoveFormToTrashResolver {
  constructor(private readonly formService: FormService) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async moveFormToTrash(
    @Form() form: FormModel,
    @Args('input') input: FormDetailInput
  ): Promise<boolean> {
    return this.formService.update(input.formId, {
      retentionAt: date().add(30, 'day').unix(),
      'settings.active': false,
      status: FormStatusEnum.TRASH
    })
  }
}
