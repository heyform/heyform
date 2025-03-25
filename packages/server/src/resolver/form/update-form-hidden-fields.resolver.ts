import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { Auth, FormGuard } from '@decorator'
import { FormService } from '@service'
import { UpdateHiddenFieldsInput } from '@graphql'

@Resolver()
@Auth()
export class UpdateFormHiddenFieldsResolver {
  constructor(private readonly formService: FormService) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async updateFormHiddenFields(
    // @Team() team: TeamModel,
    @Args('input') input: UpdateHiddenFieldsInput
  ): Promise<boolean> {
    // if (!team.plan.hiddenFields) {
    //   throw new BadRequestException('Upgrade your plan to setup hidden fields')
    // }

    return this.formService.update(input.formId, {
      hiddenFields: input.hiddenFields
    })
  }
}
