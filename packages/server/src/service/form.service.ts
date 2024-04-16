import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { FormField, FormStatusEnum } from '@heyform-inc/shared-types-enums'
import { helper, pickObject, timestamp } from '@heyform-inc/utils'

import { STRIPE_PUBLISHABLE_KEY } from '@environments'
import { FormModel } from '@model'
import { getUpdateQuery } from '@utils'

interface UpdateFiledOptions {
  formId: string
  fieldId: string
  updates: Record<string, any>
}

@Injectable()
export class FormService {
  constructor(
    @InjectModel(FormModel.name)
    private readonly formModel: Model<FormModel>
  ) {}

  async findById(id: string): Promise<FormModel | null> {
    return this.formModel.findById(id)
  }

  async findAllInTeam(teamId: string | string[]): Promise<FormModel[]> {
    const conditions: any = {
      teamId
    }

    if (helper.isValidArray(teamId)) {
      conditions.teamId = {
        $in: teamId
      }
    }

    return this.formModel.find(conditions)
  }

  async findAllInTrash(): Promise<FormModel[]> {
    return this.formModel.find({
      retentionAt: {
        $lte: timestamp(),
        $gt: 0
      },
      status: FormStatusEnum.TRASH
    })
  }

  async findAll(
    projectId: string | string[],
    status: FormStatusEnum,
    keyword?: string
  ): Promise<FormModel[]> {
    const conditions: any = {
      projectId,
      status
    }

    if (helper.isValidArray(projectId)) {
      conditions.projectId = {
        $in: projectId
      }
    }

    if (keyword) {
      conditions.name = new RegExp(keyword, 'i')
    }

    return this.formModel.find(conditions).sort({
      createdAt: -1
    })
  }

  public async countMaps(projectIds: string[]): Promise<any> {
    return this.formModel
      .aggregate<FormModel>([
        { $match: { projectId: { $in: projectIds } } },
        { $group: { _id: `$projectId`, count: { $sum: 1 } } }
      ])
      .exec()
  }

  async _internalCountAll() {
    return new Promise((resolve, reject) => {
      this.formModel.countDocuments({}, (err, count) => {
        if (err) {
          reject(err)
        } else {
          resolve(count)
        }
      })
    })
  }

  async countAll(teamId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.formModel.countDocuments(
        {
          teamId
        },
        (err, count) => {
          if (err) {
            reject(err)
          } else {
            resolve(count)
          }
        }
      )
    })
  }

  async countAllInTeams(teamIds: string[]): Promise<any> {
    return this.formModel
      .aggregate<FormModel>([
        {
          $match: {
            teamId: {
              $in: teamIds
            }
          }
        },
        {
          $group: {
            _id: `$teamId`,
            count: {
              $sum: 1
            }
          }
        }
      ])
      .exec()
  }

  public async create(form: FormModel | any): Promise<string> {
    const result = await this.formModel.create(form)
    return result.id
  }

  public async update(
    formId: string,
    updates: Record<string, any>,
    conditions?: Record<string, any>
  ): Promise<boolean> {
    const result = await this.formModel.updateOne(
      {
        _id: formId,
        ...conditions
      },
      updates
    )
    return !!result?.ok
  }

  public async delete(formId: string | string[]): Promise<boolean> {
    let result: any

    if (helper.isValidArray(formId)) {
      result = await this.formModel.deleteMany({
        _id: {
          $in: formId as string[]
        },
        status: FormStatusEnum.TRASH
      })
    } else {
      result = await this.formModel.deleteOne({
        _id: formId as string,
        status: FormStatusEnum.TRASH
      })
    }

    return result?.n > 0
  }

  public async createField(formId: string, field: FormField): Promise<boolean> {
    const result = await this.formModel.updateOne(
      {
        _id: formId
      },
      {
        $push: {
          fields: field
        }
      }
    )
    return !!result?.ok
  }

  public async updateField({ formId, fieldId, updates }: UpdateFiledOptions): Promise<boolean> {
    const result = await this.formModel.updateOne(
      {
        _id: formId,
        'fields.id': fieldId
      },
      {
        $set: getUpdateQuery(updates, 'fields.$')
      }
    )
    return !!result?.ok
  }

  public async deleteField(formId: string, fieldId: string): Promise<boolean> {
    const result = await this.formModel.updateOne(
      {
        _id: formId
      },
      {
        $pull: {
          fields: {
            id: fieldId
          }
        }
      },
      {
        multi: true
      }
    )
    return !!result?.ok
  }

  public async findPublicForm(formId: string): Promise<any | undefined> {
    const form = await this.findById(formId)

    if (
      !form ||
      form.status === FormStatusEnum.TRASH ||
      form.suspended ||
      form.draft ||
      !form.settings.active
    ) {
      return {
        id: formId,
        name: form?.name,
        fields: [],
        hiddenFields: [],
        settings: {
          active: false,
          ...pickObject(form?.settings || {}, [
            'enableClosedMessage',
            'closedFormTitle',
            'closedFormDescription'
          ])
        },
        themeSettings: form?.themeSettings
      }
    }

    const now = timestamp()
    if (
      form.settings.enableExpirationDate &&
      (now < form.settings.enabledAt ||
        (now > form.settings.closedAt && form.settings.closedAt > 0))
    ) {
      return {
        id: formId,
        name: form?.name,
        fields: [],
        hiddenFields: [],
        logics: [],
        variables: [],
        settings: {
          active: false,
          ...pickObject(form.settings, [
            'enableClosedMessage',
            'closedFormTitle',
            'closedFormDescription'
          ])
        },
        themeSettings: form.themeSettings
      }
    }

    const masked: Record<string, any> = pickObject(form.toObject(), [
      ['_id', 'id'],
      'name',
      'nameSchema',
      'interactiveMode',
      'kind',
      'hiddenFields',
      'logics',
      'variables',
      'themeSettings'
    ])

    masked.settings = pickObject(form.settings, [
      'active',
      'published',
      'enableTimeLimit',
      'timeLimit',
      'captchaKind',
      'requirePassword',
      'enableProgress',
      'locale',
      'enableClosedMessage',
      'closedFormTitle',
      'closedFormDescription'
    ])

    masked.fields = form.fields

    if (helper.isValid(form.stripeAccount?.accountId)) {
      masked.stripe = {
        accountId: form.stripeAccount!.accountId,
        publishableKey: STRIPE_PUBLISHABLE_KEY
      }
    }

    return masked
  }
}
