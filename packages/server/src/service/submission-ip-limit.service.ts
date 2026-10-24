import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { DISABLE_SUBMISSION_IP, FORM_ENCRYPTION_KEY } from '@environments'
import { helper, timestamp } from '@heyform-inc/utils'
import { FormModel, SubmissionIpLimitModel } from '@model'
import { hmac } from '@utils'

// When submission IPs mustn't be stored, count submissions against a keyed
// hash of the address instead, so the limit still works
function limitKey(ip: string): string {
  return DISABLE_SUBMISSION_IP ? hmac(ip, FORM_ENCRYPTION_KEY, 'sha256') : ip
}

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

    const key = limitKey(ip)
    const limit = await this.submissionIpLimitModel.findOne({
      formId: form.id,
      ip: key
    })

    if (!limit) {
      await this.create({
        formId: form.id,
        ip: key,
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

      const isTmpRecord = limit.count >= form.settings.ipLimitCount && limit.expiredAt < now
      const updates: Record<string, any> = {
        count: isTmpRecord ? 1 : limit.count + 1,
        expiredAt: expiredAt === 0 || isTmpRecord ? expiredAt : undefined
      }

      await this.submissionIpLimitModel.updateOne(
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
    return (result.deletedCount ?? 0) > 0
  }
}
