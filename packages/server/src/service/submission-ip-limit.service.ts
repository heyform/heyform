/**
 * @program: heyform-serves
 * @description:
 * @author: mufeng
 * @date: 11/9/21 10:23 AM
 **/

import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FormModel, SubmissionIpLimitModel } from '@model'
import { Model } from 'mongoose'
import { helper, timestamp } from '@heyform-inc/utils'

@Injectable()
export class SubmissionIpLimitService {
  constructor(
    @InjectModel(SubmissionIpLimitModel.name)
    private readonly submissionIpLimitModel: Model<SubmissionIpLimitModel>
  ) {}

  async checkIp(form: FormModel, ip: string): Promise<void> {
    let expiredAt = 0
    const now = timestamp()

    if (helper.isValid(form.settings.ipLimitTime)) {
      expiredAt = timestamp() + form.settings.ipLimitTime!
    }

    const limit = await this.submissionIpLimitModel.findOne({
      formId: form.id,
      ip
    })

    if (!limit) {
      await this.create({
        formId: form.id,
        ip,
        count: 1,
        expiredAt
      })
    } else {
      if (
        (expiredAt === 0 && limit.count >= form.settings.ipLimitCount) ||
        (expiredAt > 0 &&
          limit.count >= form.settings.ipLimitCount &&
          (limit.expiredAt === 0 || limit.expiredAt >= now))
      ) {
        throw new BadRequestException(
          'The submission quota limits, new submissions are no longer accepted'
        )
      }

      const isTmpRecord =
        limit.count >= form.settings.ipLimitCount && limit.expiredAt < now
      const updates: Record<string, any> = {
        count: isTmpRecord ? 1 : limit.count + 1,
        expiredAt: expiredAt === 0 || isTmpRecord ? expiredAt : undefined
      }

      await this.submissionIpLimitModel.update(
        {
          _id: limit.id
        },
        updates
      )
    }
  }

  public async findAll(): Promise<SubmissionIpLimitModel[]> {
    return this.submissionIpLimitModel.find({
      expiredAt: {
        $lte: timestamp(),
        $gt: 0
      }
    })
  }

  public async create(data: SubmissionIpLimitModel | any): Promise<string> {
    const result = await this.submissionIpLimitModel.create(data)
    return result.id
  }

  public async deleteByIds(ids: string[]): Promise<boolean> {
    const result = await this.submissionIpLimitModel.deleteMany({
      _id: {
        $in: ids
      }
    })
    return result?.n > 0
  }
}
