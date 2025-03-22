import { TemplateType } from '@graphql'
import { Query, Resolver } from '@nestjs/graphql'
import {
  TEABLE_API_KEY,
  TEABLE_API_URL,
  TEABLE_TEMPLATE_TABLE_ID
} from '@environments'
import { Auth } from '@decorator'
import { Teable } from '@utils'

@Resolver()
@Auth()
export class TemplatesResolver {
  private readonly teable = new Teable({
    apiURL: TEABLE_API_URL,
    apiKey: TEABLE_API_KEY
  })

  @Query(returns => [TemplateType])
  async templates(): Promise<TemplateType[]> {
    const result = await this.teable.records(TEABLE_TEMPLATE_TABLE_ID)

    return result.map(({ id, fields }) => ({
      id: fields.Embed.split('/').pop(),
      recordId: id,
      category: fields.Category[0],
      name: fields.Title,
      // @ts-ignore
      thumbnail: fields.Thumb?.[0]?.presignedUrl,
      used: fields.Used
    }))
  }
}
