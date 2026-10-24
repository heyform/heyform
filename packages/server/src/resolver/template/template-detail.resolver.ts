import { BadRequestException, NotFoundException } from '@nestjs/common'

import { Auth } from '@decorator'
import { TemplateDetailInput, TemplateDetailType } from '@graphql'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { TemplateService } from '@service'

@Resolver()
@Auth()
export class TemplateDetailResolver {
  constructor(private readonly templateService: TemplateService) {}

  @Query(returns => TemplateDetailType)
  async templateDetail(@Args('input') input: TemplateDetailInput) {
    if (!input.templateId && !input.templateSlug) {
      throw new BadRequestException('A template ID or slug is required')
    }

    const template = input.templateId
      ? await this.templateService.findPublishedById(input.templateId)
      : await this.templateService.findPublishedBySlug(input.templateSlug!)

    if (!template) {
      throw new NotFoundException('The template does not exist')
    }

    return template
  }
}
