import {
  Answer,
  SubmissionCategoryEnum,
  SubmissionStatusEnum
} from '@heyform-inc/shared-types-enums'
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { FormService } from './form.service'
import { RedisService } from './redis.service'
import { date, helper, nanoidCustomAlphabet } from '@heyform-inc/utils'
import { SubmissionModel } from '@model'
import { getUpdateQuery } from '@utils'

const { isValid } = helper
const PSEUDONYM_ID_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const PSEUDONYM_ID_LENGTH = 8
const PSEUDONYM_ID_MAX_ATTEMPTS = 5

export function generatePseudonymId(): string {
  const value = nanoidCustomAlphabet(PSEUDONYM_ID_ALPHABET, PSEUDONYM_ID_LENGTH)
  return `${value.slice(0, 4)}-${value.slice(4)}`
}

interface MongoDuplicateError {
  code?: number
  keyPattern?: Record<string, unknown>
  keyValue?: Record<string, unknown>
}

function isPseudonymIdCollision(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const { code, keyPattern, keyValue } = error as MongoDuplicateError

  return (
    code === 11000 &&
    (keyPattern?.pseudonymId === 1 ||
      Object.prototype.hasOwnProperty.call(keyValue || {}, 'pseudonymId'))
  )
}

interface FindSubmissionOptions {
  formId: string
  category?: SubmissionCategoryEnum
  labelId?: string
  page?: number
  limit?: number
}

interface UpdateCategoryOptions {
  formId: string
  submissionIds: string[]
  category: SubmissionCategoryEnum
}

@Injectable()
export class SubmissionService {
  constructor(
    @InjectModel(SubmissionModel.name)
    private readonly submissionModel: Model<SubmissionModel>,
    private readonly formService: FormService,
    private readonly redisService: RedisService
  ) {}

  async findById(id: string): Promise<SubmissionModel | null> {
    return this.submissionModel.findById(id)
  }

  async findByFormId(formId: string, submissionId: string): Promise<SubmissionModel | null> {
    return this.submissionModel.findOne({
      _id: submissionId,
      formId
    })
  }

  async findAll({
    formId,
    category,
    labelId,
    page = 1,
    limit = 30
  }: FindSubmissionOptions): Promise<SubmissionModel[]> {
    const conditions: Record<string, any> = {
      formId,
      status: SubmissionStatusEnum.PUBLIC
    }

    if (helper.isValid(category)) {
      conditions.category = category
    }

    if (helper.isValid(labelId)) {
      conditions.labels = labelId
    }

    return this.submissionModel
      .find(conditions)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({
        _id: -1
      })
  }

  async countAllWithFieldId(formId: string, fieldId: string): Promise<number> {
    return this.submissionModel.countDocuments({
      formId,
      'answers.id': fieldId,
      status: SubmissionStatusEnum.PUBLIC
    })
  }

  async findAllWithFieldId(
    formId: string,
    fieldId: string,
    page = 1,
    limit = 30
  ): Promise<SubmissionModel[]> {
    const answers = {
      $elemMatch: {
        id: fieldId as string
      }
    }
    const projections = {
      id: 1,
      answers,
      endAt: 1
    }
    const conditions: Record<string, any> = {
      formId,
      answers,
      status: SubmissionStatusEnum.PUBLIC
    }

    return this.submissionModel
      .find(conditions)
      .select(projections)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({
        endAt: -1
      })
  }

  async findAllGroupInFieldIds(
    formId: string,
    fieldIds: string[],
    limit = 10
  ): Promise<SubmissionModel[]> {
    if (helper.isEmpty(fieldIds)) {
      return []
    }

    return this.submissionModel.aggregate([
      {
        $unwind: '$answers'
      },
      {
        $match: {
          formId,
          'answers.id': {
            $in: fieldIds
          }
        }
      },
      { $sort: { endAt: -1 } },
      { $limit: limit * fieldIds.length },
      {
        $group: {
          _id: '$answers.id',
          answers: {
            $push: {
              submissionId: '$_id',
              kind: '$answers.kind',
              value: '$answers.value',
              endAt: '$endAt'
            }
          }
        }
      },
      {
        $project: {
          answers: { $slice: ['$answers', limit] }
        }
      }
    ])
  }

  public async count({ formId, category, labelId }: FindSubmissionOptions): Promise<number> {
    const conditions: Record<string, any> = {
      formId,
      status: SubmissionStatusEnum.PUBLIC
    }

    if (helper.isValid(category)) {
      conditions.category = category
    }

    if (helper.isValid(labelId)) {
      conditions.labels = labelId
    }
    return this.submissionModel.countDocuments(conditions)
  }

  public async countInForm(formId: string): Promise<number> {
    return this.submissionModel.countDocuments({
      formId
    })
  }

  public async countAllInTeam(teamId: string): Promise<number> {
    const forms = await this.formService.findAllInTeam(teamId)

    if (isValid(forms)) {
      return this.countAll(
        forms.map(f => f._id),
        {
          createdAt: {
            $gte: date().startOf('month').toDate()
          }
        }
      )
    }

    return 0
  }

  public countAll(formIds: string[], filters: Record<string, any> = {}): Promise<number> {
    return this.submissionModel.countDocuments({
      formId: {
        $in: formIds
      },
      ...filters
    })
  }

  public async countInForms(formIds: string[]): Promise<any> {
    return this.submissionModel
      .aggregate<SubmissionModel>([
        {
          $match: {
            formId: {
              $in: formIds
            }
          }
        },
        {
          $group: {
            _id: `$formId`,
            count: {
              $sum: 1
            }
          }
        }
      ])
      .exec()
  }

  public async countInTeams(teamIds: string[]): Promise<any> {
    return this.submissionModel
      .aggregate<SubmissionModel>([
        {
          $match: {
            teamId: {
              $in: teamIds
            }
          }
        },
        {
          $group: {
            _id: `$formId`,
            count: {
              $sum: 1
            }
          }
        }
      ])
      .exec()
  }

  public async create(submission: SubmissionModel | any): Promise<string> {
    const result = await this.submissionModel.create(submission)
    return result.id
  }

  public async createWithinQuota(
    submission: SubmissionModel | any,
    quotaLimit?: number
  ): Promise<string> {
    if (!Number.isSafeInteger(quotaLimit) || quotaLimit! < 1) {
      return this.create(submission)
    }

    // Serialize the authoritative Mongo count and insert. Unlike a second counter, this cannot
    // drift when submissions are deleted, imported, or a write fails after reserving a slot.
    return this.redisService.withLock(`submission-quota:${submission.formId}`, '30s', async () => {
      const count = await this.countInForm(submission.formId)

      if (count >= quotaLimit!) {
        throw new BadRequestException(
          'The submission quota exceeds, new submissions are no longer accepted'
        )
      }

      return this.create(submission)
    })
  }

  public async createWithPseudonymWithinQuota(
    submission: SubmissionModel | Record<string, unknown>,
    quotaLimit?: number,
    generateId: () => string = generatePseudonymId
  ): Promise<{ id: string; pseudonymId: string }> {
    for (let attempt = 0; attempt < PSEUDONYM_ID_MAX_ATTEMPTS; attempt += 1) {
      const pseudonymId = generateId()

      try {
        const id = await this.createWithinQuota(
          {
            ...submission,
            pseudonymId
          },
          quotaLimit
        )

        return { id, pseudonymId }
      } catch (error) {
        if (!isPseudonymIdCollision(error)) {
          throw error
        }
      }
    }

    throw new InternalServerErrorException('Failed to generate a unique pseudonym ID')
  }

  public async maskAsPrivate(formId: string, submissionIds?: string[]): Promise<boolean> {
    const conditions: any = {
      formId
    }

    if (submissionIds) {
      conditions._id = {
        $in: submissionIds
      }
    }

    const result = await this.submissionModel.updateOne(conditions, {
      status: SubmissionStatusEnum.PRIVATE
    })
    return result.matchedCount > 0
  }

  public async deleteByIds(formId: string, submissionIds?: string[]): Promise<boolean> {
    const conditions: any = {
      formId
    }

    if (submissionIds) {
      conditions._id = {
        $in: submissionIds
      }
    }

    const result = await this.submissionModel.deleteMany(conditions)
    return (result.deletedCount ?? 0) > 0
  }

  public async deleteAll(formId: string | string[]): Promise<boolean> {
    const conditions: Record<string, any> = {
      formId
    }

    if (helper.isValidArray(formId)) {
      conditions.formId = {
        $in: formId as string[]
      }
    }

    const result = await this.submissionModel.deleteMany(conditions)
    return (result.deletedCount ?? 0) > 0
  }

  public async updateCategory({
    formId,
    submissionIds,
    category
  }: UpdateCategoryOptions): Promise<boolean> {
    const result = await this.submissionModel.updateMany(
      {
        formId,
        _id: {
          $in: submissionIds
        }
      },
      {
        category
      }
    )
    return result.matchedCount > 0
  }

  async findByIds(formId: string, submissionIds: string[]): Promise<SubmissionModel[]> {
    const conditions: Record<string, any> = {
      formId,
      _id: {
        $in: submissionIds
      },
      status: SubmissionStatusEnum.PUBLIC
    }
    return this.submissionModel.find(conditions)
  }

  async findAllByForm(formId: string): Promise<SubmissionModel[]> {
    let submissions = []
    const limit = 1000
    const submissionCount = await this.count({
      formId
    })

    if (submissionCount < limit) {
      submissions = await this.findAll({
        formId,
        page: 1,
        limit
      })
    } else {
      const promises = []
      const max = Math.ceil(submissionCount / limit)

      for (let i = 1; i <= max; i++) {
        promises.push(
          this.findAll({
            formId,
            page: i,
            limit
          })
        )
      }

      const result = await Promise.all(promises)
      submissions = result.reduce((prev, next) => [...prev, ...next], [])
    }

    return submissions
  }

  async createAnswer(submissionId: string, answer: Answer): Promise<boolean> {
    const result = await this.submissionModel.updateOne(
      {
        _id: submissionId
      },
      {
        $push: {
          answers: answer
        }
      }
    )
    return result.acknowledged
  }

  async updateAnswer(submissionId: string, answer: Answer): Promise<boolean> {
    const updates = {
      kind: answer.kind,
      properties: answer.properties,
      value: answer.value
    }

    const result = await this.submissionModel.updateOne(
      {
        _id: submissionId,
        'answers.id': answer.id
      },
      {
        $set: getUpdateQuery(updates, 'answers.$', false)
      }
    )
    return result.acknowledged
  }

  async analytic(formId: string, startAt: number, endAt: number) {
    return this.submissionModel.aggregate([
      {
        $match: {
          formId: formId,
          startAt: { $gte: startAt },
          endAt: { $lte: endAt }
        }
      },
      {
        $group: {
          _id: null,
          avgAverageTime: {
            $avg: { $subtract: ['$endAt', '$startAt'] }
          },
          avgSubmissionCount: { $sum: 1 }
        }
      }
    ])
  }
}
