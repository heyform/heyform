/**
 * @program: servers
 * @description: Third Party service
 * @author: Mufeng
 * @date: 2021-06-11 11:30
 **/

import { hs, timestamp } from '@heyform-inc/utils'
import { ThirdPartyOauthModel } from '@model'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

@Injectable()
export class ThirdPartyService {
  constructor(
    @InjectModel(ThirdPartyOauthModel.name)
    private readonly thirdPartyOauthModel: Model<ThirdPartyOauthModel>
  ) {}

  async findById(id: string): Promise<ThirdPartyOauthModel | null> {
    return this.thirdPartyOauthModel.findById(id)
  }

  async findAllExpired(appId: string): Promise<ThirdPartyOauthModel[]> {
    return this.thirdPartyOauthModel.find({
      appId,
      'tokens.expiryDate': {
        $gt: 0,
        $lte: timestamp() + hs('15m')
      }
    })
  }

  async findByAppAndOpenId(
    appId: string,
    openId: string
  ): Promise<ThirdPartyOauthModel | null> {
    return this.thirdPartyOauthModel.findOne({
      appId,
      openId: {
        $eq: openId,
        $ne: null
      }
    })
  }

  async create(
    thirdPartyOauth: ThirdPartyOauthModel | any
  ): Promise<string | null> {
    const result = await this.thirdPartyOauthModel.create(thirdPartyOauth)
    return result.id
  }

  public async update(
    thirdPartyOauthId: string,
    updates: Record<string, any>
  ): Promise<boolean> {
    const result = await this.thirdPartyOauthModel.updateOne(
      {
        _id: thirdPartyOauthId
      },
      updates
    )
    return !!result?.ok
  }

  public async createOrUpdate(
    appId: string,
    openId: string,
    scope = '',
    updates: Record<string, any>
  ): Promise<string> {
    const thirdPartyOauth = await this.thirdPartyOauthModel.findOne({
      appId,
      openId,
      scope
    })

    if (thirdPartyOauth) {
      await this.update(thirdPartyOauth.id, updates)
      return thirdPartyOauth.id
    }

    return this.create({
      appId,
      openId,
      scope,
      ...updates
    })
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.thirdPartyOauthModel.deleteOne({
      _id: id
    })
    return result?.n > 0
  }
}
