import { TemplateDetailInput, TemplateType } from '@graphql'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { FormService } from '@service'
import { TEMPLATES_TEAM_ID } from '@environments'
import { Auth } from '@decorator'

@Resolver()
@Auth()
export class TemplateDetailResolver {
  constructor(private readonly formService: FormService) {}

  @Query(returns => TemplateType)
  async templateDetail(@Args('input') input: TemplateDetailInput) {
    return this.formService.findByIdInTeam(input.templateId, TEMPLATES_TEAM_ID)
  }
}
