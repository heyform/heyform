/**
 * Created by jiangwei on 2020/11/08.
 * Copyright (c) 2020 Heyooo, Inc. all rights reserved
 */
import { date, nanoid, timestamp } from '@heyform-inc/utils'
import {
  AppCodeModel,
  AppInternalTypeEnum,
  AppModel,
  AppStatusEnum
} from '@model'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

interface SharedOptions {
  appId: string
  userId: string
}

interface CreateCodeOptions extends SharedOptions {
  redirectUri: string
}

@Injectable()
export class AppService {
  constructor(
    @InjectModel(AppModel.name)
    private readonly appModel: Model<AppModel>,
    @InjectModel(AppCodeModel.name)
    private readonly appCodeModel: Model<AppCodeModel>
  ) {}

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
        status: AppStatusEnum.ACTIVE
      })
      .sort({
        uniqueId: 1
      })
  }

  async findAllByUniqueIds(uniqueIds: string[]): Promise<AppModel[]> {
    return this.appModel.find({
      uniqueId: {
        $in: uniqueIds
      }
    })
  }

  async findAllByInternalType(
    internalType: AppInternalTypeEnum
  ): Promise<AppModel[]> {
    return this.appModel
      .find({
        internalType,
        status: {
          $in: [AppStatusEnum.ACTIVE]
        }
      })
      .sort({
        _id: -1
      })
  }

  async findCode(codeId: string): Promise<AppCodeModel | null> {
    return this.appCodeModel.findById(codeId)
  }

  async createCode(options: CreateCodeOptions): Promise<string | null> {
    const result = await this.appCodeModel.create({
      ...options,
      expireAt: date().add(2, 'hour').unix()
    } as any)
    return result.id
  }

  async deleteCode(codeId: string): Promise<boolean> {
    const result = await this.appCodeModel.deleteOne({
      _id: codeId
    })
    return result?.n > 0
  }

  async deleteExpiredCodes(): Promise<boolean> {
    const result = await this.appCodeModel.deleteMany({
      expireAt: {
        $lt: timestamp()
      }
    })
    return result?.n > 0
  }
}
