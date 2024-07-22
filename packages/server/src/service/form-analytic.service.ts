import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { date, helper } from '@heyform-inc/utils'

import { FormAnalyticModel } from '@model'
import { SubmissionService } from './submission.service'

interface FormAnalyticOptions {
  formId: string
  endAt: Date
  range: number
}

@Injectable()
export class FormAnalyticService {
  constructor(
    @InjectModel(FormAnalyticModel.name)
    private readonly formAnalyticModel: Model<FormAnalyticModel>,
    private readonly submissionService: SubmissionService
  ) {}

  public async summary({ formId, endAt, range }: FormAnalyticOptions) {
    const startAt = date(endAt).subtract(range, 'days').startOf('day').toDate()

    const [avgTotalVisits, result] = await Promise.all([
      this.getAverageTotalVisits(formId, startAt, endAt),
      this.submissionService.analytic(
        formId,
        Math.floor(startAt.getTime() / 1000),
        Math.floor(endAt.getTime() / 1000)
      )
    ])

    const analytic = {
      totalVisits: avgTotalVisits,
      submissionCount: 0,
      averageTime: 0
    }

    if (helper.isValidArray(result)) {
      analytic.submissionCount = result[0].submissionCount
      analytic.averageTime = result[0].averageTime
    }

    return analytic
  }

  public async getAverageTotalVisits(formId: string, startAt: Date, endAt: Date): Promise<number> {
    const result = await this.formAnalyticModel.aggregate([
      {
        $match: {
          formId,
          createdAt: {
            $gte: startAt,
            $lte: endAt
          }
        }
      },
      {
        $group: {
          _id: null,
          avgTotalVisits: { $avg: '$totalVisits' }
        }
      }
    ])

    return result[0]?.avgTotalVisits || 0
  }

  /**
   * Increase total visits
   */
  public async updateTotalVisits(formId: string): Promise<void> {
    const formAnalytic = await this.findFormAnalyticInToday(formId)

    if (formAnalytic) {
      await this.formAnalyticModel.updateOne(
        {
          _id: formAnalytic.id
        },
        {
          $inc: {
            totalVisits: 1
          }
        }
      )
    } else {
      await this.formAnalyticModel.create({
        formId,
        totalVisits: 1
      } as any)
    }
  }

  private async findFormAnalyticInToday(formId: string): Promise<FormAnalyticModel> {
    const today = date()

    return this.formAnalyticModel.findOne({
      formId,
      createdAt: {
        $gte: today.startOf('day'),
        $lte: today.endOf('day')
      }
    })
  }
}
