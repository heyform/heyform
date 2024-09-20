import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { resolve } from 'path'
import { nanoid } from '@heyform-inc/utils'

import { AppModel, AppStatusEnum } from '@model'
import { ROOT_PATH } from '@environments'

@Injectable()
export class AppService {
  constructor(@InjectModel(AppModel.name) private readonly appModel: Model<AppModel>) {}

  async onApplicationBootstrap(): Promise<any> {
    const apps = await import(resolve(ROOT_PATH, 'resources/apps.json'))

    try {
      await this.appModel.insertMany(apps, {
        ordered: false
      })
    } catch {}
  }

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
