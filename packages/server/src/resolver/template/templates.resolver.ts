import { Args, Query, Resolver } from '@nestjs/graphql'

import { TemplateType, TemplatesInput } from '@graphql'
import { TemplateModel } from '@model'
import { TemplateService } from '@service'

@Resolver()
export class TemplatesResolver {
  constructor(private readonly templateService: TemplateService) {}

  @Query(returns => [TemplateType])
  async templates(@Args('input') input: TemplatesInput): Promise<TemplateModel[]> {
    return this.templateService.findAll(input.keyword, input.limit)
  }
}
