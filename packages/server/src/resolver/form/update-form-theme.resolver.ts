import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { Auth, FormGuard, Team } from '@decorator'
import { UpdateFormThemeInput } from '@graphql'
import { TeamModel } from '@model'
import { FormService } from '@service'

@Resolver()
@Auth()
export class UpdateFormThemeResolver {
  constructor(private readonly formService: FormService) {}

  /**
   * Update form theme
   *
   * @param team
   * @param input
   */
  @Mutation(returns => Boolean)
  @FormGuard()
  async updateFormTheme(
    @Team() team: TeamModel,
    @Args('input') input: UpdateFormThemeInput
  ): Promise<boolean> {
    return await this.formService.update(input.formId, {
      themeSettings: {
        theme: input.theme
      }
    })
  }
}
