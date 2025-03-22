import { Auth, FormGuard } from '@decorator'
import {
  FormAnalyticInput,
  FormAnalyticResult,
  FormAnalyticType
} from '@graphql'
import { date, helper, parseJson } from '@heyform-inc/utils'
import { FormAnalyticRangeEnum } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { FormAnalyticService, RedisService } from '@service'
import { Promise } from 'mongoose'

function getChanges(prev: number, next: number, isInteger = true) {
  const result: FormAnalyticResult = {
    value: isInteger ? Math.ceil(next) : next
  }

  if (helper.isValid(prev)) {
    const p = prev || 1
    result.change = Math.round(((next - p) * 100) / p)
  }

  return result
}

function getRate(totalVisits: number, submissionCount: number) {
  if (helper.isNil(totalVisits) || helper.isNil(submissionCount)) {
    return
  }

  if (totalVisits > 0 && submissionCount > 0) {
    return Math.min(100, 100 * (submissionCount / totalVisits))
  } else if (totalVisits < 1 && submissionCount > 1) {
    return 100
  } else {
    return 0
  }
}

@Resolver()
@Auth()
export class FormAnalyticResolver {
  constructor(
    private readonly formAnalyticService: FormAnalyticService,
    private readonly redisService: RedisService
  ) {}

  /**
   * Details of the form
   *
   * @param input
   */
  @Query(returns => FormAnalyticType)
  @FormGuard()
  async formAnalytic(
    @Args('input') input: FormAnalyticInput
  ): Promise<FormAnalyticType> {
    const key = `form:${input.formId}:analytic:${input.range}`
    const cache = await this.redisService.get(key)

    if (helper.isValid(cache)) {
      return parseJson(cache)
    }

    const now = date().endOf('day')
    let startAt: Date
    let prevStartAt: Date

    switch (input.range) {
      case FormAnalyticRangeEnum.WEEK:
        startAt = now.subtract(7, 'days').startOf('day').toDate()
        prevStartAt = now.subtract(14, 'days').startOf('day').toDate()
        break

      case FormAnalyticRangeEnum.MONTH:
        startAt = now.subtract(1, 'months').startOf('day').toDate()
        prevStartAt = now.subtract(2, 'months').startOf('day').toDate()
        break

      case FormAnalyticRangeEnum.THREE_MONTH:
        startAt = now.subtract(3, 'months').startOf('day').toDate()
        prevStartAt = now.subtract(6, 'months').startOf('day').toDate()
        break

      case FormAnalyticRangeEnum.SIX_MONTH:
        startAt = now.subtract(6, 'months').startOf('day').toDate()
        prevStartAt = now.subtract(12, 'months').startOf('day').toDate()
        break

      case FormAnalyticRangeEnum.YEAR:
        startAt = now.subtract(1, 'years').startOf('day').toDate()
        prevStartAt = now.subtract(2, 'years').startOf('day').toDate()
        break
    }

    const [prev, next] = await Promise.all([
      this.formAnalyticService.summary({
        formId: input.formId,
        startAt: prevStartAt,
        endAt: startAt
      }),
      this.formAnalyticService.summary({
        formId: input.formId,
        startAt,
        endAt: now.toDate(),
        isNext: true
      })
    ])

    const prevRate = getRate(prev.avgTotalVisits, prev.avgSubmissionCount)
    const nextRate = getRate(next.avgTotalVisits, next.avgSubmissionCount)

    const result = {
      totalVisits: getChanges(prev.avgTotalVisits, next.avgTotalVisits),
      submissionCount: getChanges(
        prev.avgSubmissionCount,
        next.avgSubmissionCount
      ),
      completeRate: {
        value: nextRate,
        change: prevRate ? nextRate - prevRate : undefined
      },
      averageTime: getChanges(prev.avgAverageTime, next.avgAverageTime, false)
    }

    await this.redisService.set({
      key,
      value: JSON.stringify(result),
      duration: '10m'
    })

    return result
  }
}
