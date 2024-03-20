import { Args, Query, Resolver } from '@nestjs/graphql'

import { helper } from '@heyform-inc/utils'

import { TemplateDetailInput, TemplateDetailType } from '@graphql'
import { TemplateModel } from '@model'
import { TemplateService } from '@service'

@Resolver()
export class TemplateDetailResolver {
  constructor(private readonly templateService: TemplateService) {}

  @Query(returns => TemplateDetailType)
  async templateDetail(@Args('input') input: TemplateDetailInput): Promise<TemplateModel> {
    if (helper.isValid(input.templateSlug)) {
      return this.templateService.findBySlug(input.templateSlug)
    } else {
      return this.templateService.findById(input.templateId)
    }
  }
}
