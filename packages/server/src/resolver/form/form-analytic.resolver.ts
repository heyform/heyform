import { Args, Query, Resolver } from '@nestjs/graphql'

import { date } from '@heyform-inc/utils'

import { Auth, FormGuard } from '@decorator'
import { FormAnalyticInput, FormAnalyticType } from '@graphql'
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
  @Query(returns => FormAnalyticType)
  @FormGuard()
  async formAnalytic(@Args('input') input: FormAnalyticInput): Promise<FormAnalyticType> {
    const endAt = date().endOf('day')
    const params = {
      formId: input.formId,
      endAt: endAt.toDate(),
      range: input.range
    }

    return this.formAnalyticService.summary(params)
  }
}
