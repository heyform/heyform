import { Injectable } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { InjectRedis } from '@svtslv/nestjs-ioredis'
import { promiseTimeout } from '@utils'
import { Redis } from 'ioredis'
import { Connection } from 'mongoose'

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectRedis() private readonly redis: Redis
  ) {}

  async pingDb(timeout = 1000): Promise<unknown> {
    const promise =
      this.connection.readyState === 1 ? Promise.resolve() : Promise.reject()
    return await promiseTimeout(timeout, promise)
  }

  async pingRedis(): Promise<string> {
    return await this.redis.ping()
  }
}
