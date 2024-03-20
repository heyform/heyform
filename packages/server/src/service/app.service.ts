import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { nanoid } from '@heyform-inc/utils'

import { AppModel, AppStatusEnum } from '@model'

@Injectable()
export class AppService {
  constructor(@InjectModel(AppModel.name) private readonly appModel: Model<AppModel>) {}

  async create(app: AppModel | any): Promise<string | null> {
    app.clientId = nanoid()
    app.clientSecret = nanoid()
    const result = await this.appModel.create(app)
    return result.id
  }

  async findById(appId: string): Promise<AppModel | null> {
    return this.appModel.findOne({
      _id: appId,
      status: AppStatusEnum.ACTIVE
    })
  }

  async findByClientId(clientId: string): Promise<AppModel | null> {
    return this.appModel.findOne({
      clientId,
      status: AppStatusEnum.ACTIVE
    })
  }

  async findAll(): Promise<AppModel[]> {
    return this.appModel
      .find({
        status: {
          $in: [AppStatusEnum.PENDING, AppStatusEnum.ACTIVE]
        }
      })
      .sort({
        _id: -1
      })
  }

  async findAllByUniqueIds(uniqueIds: string[]): Promise<AppModel[]> {
    return this.appModel.find({
      uniqueId: {
        $in: uniqueIds
      }
    })
  }
}
