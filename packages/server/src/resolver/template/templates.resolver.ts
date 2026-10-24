import { Auth } from '@decorator'
import { TemplateType } from '@graphql'
import { Query, Resolver } from '@nestjs/graphql'
import { TemplateService } from '@service'

@Resolver()
@Auth()
export class TemplatesResolver {
  constructor(private readonly templateService: TemplateService) {}

  @Query(returns => [TemplateType])
  async templates() {
    return this.templateService.findAll()
  }
}
