import { hs, nanoid, timestamp } from '@heyform-inc/utils'
import { UserModel } from '@model'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RedisService } from './redis.service'
import { Queue } from 'bull'
import { InjectQueue } from '@nestjs/bull'
import { Lark2QueueJob } from '../queue/lark2.queue'
import { larkBotConfig } from '@config'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserModel.name) private readonly userModel: Model<UserModel>,
    private readonly redisService: RedisService,
    @InjectQueue('Lark2Queue') private readonly lark2Queue: Queue<Lark2QueueJob>
  ) {}

  async findById(id: string): Promise<UserModel | null> {
    return this.userModel.findById(id)
  }

  async _internalFindAll() {
    return this.userModel.find()
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

  async createSuToken(userId: string): Promise<string> {
    const key = `su:${userId}`
    const token = nanoid()

    await this.redisService.set({
      key,
      value: token,
      duration: '1h'
    })

    return token
  }

  async verifySuToken(userId: string, token: string): Promise<boolean> {
    const key = `su:${userId}`
    const value = await this.redisService.get(key)
    return token === value
  }

  async _internalCountAll(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.userModel.countDocuments({}, (err, count) => {
        if (err) {
          reject(err)
        } else {
          resolve(count)
        }
      })
    })
  }

  public report(email: string) {
    this.lark2Queue.add({
      queueName: 'Lark2Queue',
      webhookUrl: larkBotConfig.reportUrl,
      message: {
        msg_type: 'text',
        content: {
          text: `User ${email} just signed up HeyForm`
        }
      }
    })
  }

  public async blockUsers(ids: string[]) {
    await this.userModel.updateMany(
      {
        _id: {
          $in: ids
        },
        isBlocked: false
      },
      {
        isBlocked: true,
        blockedAt: timestamp(),
        isDeletionScheduled: true,
        deletionScheduledAt: timestamp() + hs('30d')
      }
    )
  }
}
