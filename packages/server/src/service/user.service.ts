import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { timestamp } from '@heyform-inc/utils'
import { UserModel } from '@model'
import { Logger, isDuplicateEmailError } from '@utils'

@Injectable()
export class UserService implements OnModuleInit {
  private readonly logger = new Logger(UserService.name)

  constructor(@InjectModel(UserModel.name) private readonly userModel: Model<UserModel>) {}

  async onModuleInit() {
    // Mongoose builds the indexes at startup and drops the error when one fails. Wait for the
    // build, since MongoDB accepts duplicate writes while it runs and then abandons the index.
    // The build fails on a database where accounts already share an address, so say which.
    await this.userModel
      .init()
      .catch(error => this.reportIndexError(error))
      .catch(error => this.logger.error(`Couldn't check the users indexes: ${error?.message}`))
  }

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

  // Throws a duplicate key error (see isDuplicateEmailError) when the email is taken
  async create(user: UserModel | any): Promise<string | undefined> {
    const result = await this.userModel.create(user as any)
    return result.id
  }

  // Throws a duplicate key error (see isDuplicateEmailError) when `updates` sets a taken email
  async update(id: string, updates: Record<string, any>): Promise<any> {
    const result = await this.userModel.updateOne(
      {
        _id: id
      },
      updates
    )
    return result.acknowledged
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.userModel.deleteOne({
      _id: id
    })
    return (result.deletedCount ?? 0) > 0
  }

  private async reportIndexError(error: unknown): Promise<void> {
    if (!isDuplicateEmailError(error)) {
      this.logger.error(`Couldn't build the users indexes: ${(error as Error)?.message ?? error}`)
      return
    }

    const groups = await this.findAccountsSharingAnEmail()

    this.logger.error(
      `Some accounts share an email address, so the unique email index on usermodels wasn't ` +
        `built. Until it is, two sign-ups at the same moment can create another such pair, and ` +
        `password login and reset find only one account of each. Give each account its own ` +
        `address or delete the ones nobody uses, then restart HeyForm to build the index. ` +
        `Accounts sharing an address, by user ID: ${groups.map(ids => ids.join(', ')).join('; ')}`
    )
  }

  private async findAccountsSharingAnEmail(): Promise<string[][]> {
    const groups = await this.userModel.aggregate<{ ids: unknown[] }>([
      { $match: { email: { $gt: '' } } },
      { $group: { _id: '$email', ids: { $push: '$_id' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ])

    return groups.map(group => group.ids.map(String))
  }
}
