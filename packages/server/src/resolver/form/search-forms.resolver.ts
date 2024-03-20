import { Args, Query, Resolver } from '@nestjs/graphql'

import { FormStatusEnum } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'

import { Auth, TeamGuard, User } from '@decorator'
import { SearchFormInput, SearchFormType } from '@graphql'
import { UserModel } from '@model'
import { FormService, TeamService, TemplateService } from '@service'

@Resolver()
@Auth()
export class SearchFormsResolver {
  constructor(
    private readonly teamService: TeamService,
    private readonly formService: FormService,
    private readonly templateService: TemplateService
  ) {}

  @Query(returns => [SearchFormType])
  @TeamGuard()
  async searchForms(
    @Args('input') input: SearchFormInput,
    @User() user: UserModel
  ): Promise<SearchFormType[]> {
    const teams = await this.teamService.findAll(user.id)
    const forms = []

    if (helper.isValid(teams)) {
      const result = await this.formService.findAll(
        teams.map(team => team.id),
        FormStatusEnum.NORMAL,
        input.keyword
      )
      result.forEach(row => {
        forms.push({
          teamId: row.teamId,
          teamName: teams.find(team => team.id === row.teamId).name,
          formId: row.id,
          formName: row.name
        })
      })
    }

    const templates = await this.templateService.findAll(input.keyword)
    templates.forEach(row => {
      forms.push({
        templateId: row.id,
        templateName: row.name
      })
    })

    return forms
  }
}
