import { Args, Query, Resolver } from '@nestjs/graphql'

import { date } from '@heyform-inc/utils'

import { Auth, FormGuard } from '@decorator'
import { FormAnalyticInput, FormAnalyticType } from '@graphql'
import { FormAnalyticModel } from '@model'
import { FormAnalyticService } from '@service'

@Resolver()
@Auth()
export class FormAnalyticResolver {
  constructor(private readonly formAnalyticService: FormAnalyticService) {}

  /**
   * Details of the form
   *
   * @param input
   */
  @Query(returns => [FormAnalyticType])
  @FormGuard()
  async formAnalytic(@Args('input') input: FormAnalyticInput): Promise<FormAnalyticModel[]> {
    const endAt = date().endOf('day')
    const params = {
      formId: input.formId,
      endAt: endAt.toDate(),
      range: input.range
    }

    const result = await this.formAnalyticService.summary(params)
    return result.reverse()
  }
}
