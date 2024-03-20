import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { timestamp } from '@heyform-inc/utils'

import { UserModel } from '@model'

@Injectable()
export class UserService {
  constructor(@InjectModel(UserModel.name) private readonly userModel: Model<UserModel>) {}

  async findById(id: string): Promise<UserModel | null> {
    return this.userModel.findById(id)
  }

  async findAll(ids: string[]): Promise<UserModel[]> {
    return this.userModel.find({
      _id: {
        $in: ids
      }
    })
  }

  async findAllDeletionScheduled(): Promise<UserModel[]> {
    return this.userModel.find({
      isDeletionScheduled: true,
      deletionScheduledAt: {
        $gt: 0,
        $lte: timestamp()
      }
    })
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    return this.userModel.findOne({
      email
    })
  }

  async create(user: UserModel | any): Promise<string | undefined> {
    const result = await this.userModel.create(user as any)
    return result.id
  }

  async update(id: string, updates: Record<string, any>): Promise<any> {
    const result = await this.userModel.updateOne(
      {
        _id: id
      },
      updates
    )
    return !!result?.ok
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.userModel.deleteOne({
      _id: id
    })
    return result?.n > 0
  }
}
