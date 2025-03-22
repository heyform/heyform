import { Auth, FormGuard, Team } from '@decorator'
import { UpdateFormThemeInput } from '@graphql'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormService } from '@service'
import { BadRequestException } from '@nestjs/common'
import { TeamModel } from '@model'

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
    if (!team.plan.themeCustomization) {
      throw new BadRequestException(
        'Upgrade your plan to setup theme customization'
      )
    }

    return await this.formService.update(input.formId, {
      themeSettings: {
        logo: input.logo,
        theme: input.theme
      }
    })
  }
}
