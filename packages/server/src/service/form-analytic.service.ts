import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { date } from '@heyform-inc/utils'

import { FormAnalyticModel } from '@model'

interface FormAnalyticOptions {
  formId: string
  endAt: Date
  range: number
}

@Injectable()
export class FormAnalyticService {
  constructor(
    @InjectModel(FormAnalyticModel.name)
    private readonly formAnalyticModel: Model<FormAnalyticModel>
  ) {}

  public async summary({
    formId,
    endAt,
    range
  }: FormAnalyticOptions): Promise<FormAnalyticModel[]> {
    return this.formAnalyticModel
      .find({
        formId,
        createdAt: {
          $lte: endAt
        }
      })
      .limit(range)
      .sort({
        createdAt: -1
      })
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
        totalVisits: 1,
        submissionCount: 0,
        averageTime: 0
      } as any)
    }
  }

  /**
   * Update submission count and calculate average time
   *
   * @param formId
   * @param duration
   */
  public async updateCountAndAverageTime(formId: string, duration: number): Promise<void> {
    const formAnalytic = await this.findFormAnalyticInToday(formId)

    let submissionCount = 0
    let prevAverageTime = 0

    if (formAnalytic) {
      submissionCount = formAnalytic?.submissionCount || 0
      prevAverageTime = formAnalytic?.averageTime || 0
    }

    const averageTime = Math.floor(
      (duration + submissionCount * prevAverageTime) / (submissionCount + 1)
    )

    if (formAnalytic) {
      await this.formAnalyticModel.updateOne(
        {
          _id: formAnalytic.id
        },
        {
          $inc: {
            submissionCount: 1
          },
          averageTime
        }
      )
    } else {
      await this.formAnalyticModel.create({
        formId,
        totalVisits: 1,
        submissionCount: 1,
        averageTime
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
