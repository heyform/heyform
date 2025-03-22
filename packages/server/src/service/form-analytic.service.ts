import { date, helper } from '@heyform-inc/utils'
import { FormAnalyticModel } from '@model'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { SubmissionService } from './submission.service'

interface FormAnalyticOptions {
  formId: string
  startAt: Date
  endAt: Date
  isNext?: boolean
}

interface FormAnalyticResult {
  avgTotalVisits: number
  avgSubmissionCount: number
  avgAverageTime: number
}

@Injectable()
export class FormAnalyticService {
  constructor(
    @InjectModel(FormAnalyticModel.name)
    private readonly formAnalyticModel: Model<FormAnalyticModel>,
    private readonly submissionService: SubmissionService
  ) {}

  public async summary({
    formId,
    startAt,
    endAt,
    isNext
  }: FormAnalyticOptions) {
    const [avgTotalVisits, result] = await Promise.all([
      this.getAverageTotalVisits(formId, startAt, endAt),
      this.submissionService.analytic(
        formId,
        Math.floor(startAt.getTime() / 1000),
        Math.floor(endAt.getTime() / 1000)
      )
    ])

    const analytic = {
      avgTotalVisits: 0,
      avgSubmissionCount: 0,
      avgAverageTime: 0
    }

    if (avgTotalVisits > 0) {
      analytic.avgTotalVisits = avgTotalVisits

      if (helper.isValidArray(result)) {
        analytic.avgSubmissionCount = result[0].avgSubmissionCount
        analytic.avgAverageTime = result[0].avgAverageTime
      }

      return analytic
    } else if (isNext) {
      return analytic
    } else {
      return {} as FormAnalyticResult
    }
  }

  public async getAverageTotalVisits(
    formId: string,
    startAt: Date,
    endAt: Date
  ): Promise<number> {
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

  private async findFormAnalyticInToday(
    formId: string
  ): Promise<FormAnalyticModel> {
    const today = date()

    return this.formAnalyticModel.findOne({
      formId,
      createdAt: {
        $gte: today.startOf('day'),
        $lte: today.endOf('day')
      }
    })
  }

  public async delete(formId: string | string[]): Promise<boolean> {
    let result: any

    if (helper.isValidArray(formId)) {
      result = await this.formAnalyticModel.deleteMany({
        formId: {
          $in: formId as string[]
        }
      })
    } else {
      result = await this.formAnalyticModel.deleteOne({
        formId: formId as string
      })
    }

    return result?.n > 0
  }
}
