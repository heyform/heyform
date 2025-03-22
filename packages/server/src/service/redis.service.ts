import { hs } from '@heyform-inc/utils'
import { ConflictException, Injectable } from '@nestjs/common'
import { InjectRedis } from '@svtslv/nestjs-ioredis'
import { Redis } from 'ioredis'

interface BaseOptions {
  key: string
}

interface SetOptions extends BaseOptions {
  value: any
  duration: string
}

interface HsetOptions extends SetOptions {
  field: string
}

interface HgetOptions extends BaseOptions {
  field?: string
}

interface HdelOptions extends BaseOptions {
  field?: string | string[]
}

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  public get(key: string): Promise<string | null> {
    return this.redis.get(key)
  }

  public async getInt(key: string, defaultValue = 0): Promise<number> {
    const result = await this.get(key)

    return parseInt(result, defaultValue)
  }

  public async throttler(key: string, limit: number, ttl: string) {
    const cache = await this.get(key)
    let count = 0

    if (!cache) {
      await this.multi([
        ['incr', key],
        ['expire', key, hs(ttl)]
      ])
    } else {
      count = parseInt(cache, 0)
    }

    if (count >= limit) {
      const timeLeft = await this.redis.ttl(key)

      throw new ConflictException(
        `Too many requests. Please try again in ${timeLeft} seconds.`
      )
    }

    await this.incr(key)
  }

  public set({ key, value, duration }: SetOptions): Promise<any> {
    return this.redis.set(key, value, 'ex', hs(duration))
  }

  public hset({
    key,
    field,
    value,
    duration
  }: HsetOptions): Promise<[Error | null, any][]> {
    return this.multi([
      ['hset', key, field, value],
      ['expire', key, hs(duration)]
    ])
  }

  public hsetObject({
    key,
    value: obj,
    duration
  }: SetOptions): Promise<[Error | null, any][]> {
    return this.multi([
      ...Object.keys(obj).map(field => ['hset', key, field, obj[field]]),
      ['expire', key, hs(duration)]
    ])
  }

  public hget({
    key,
    field
  }: HgetOptions): Promise<string | null> | Promise<Record<string, string>> {
    if (field) {
      return this.redis.hget(key, field)
    }
    return this.redis.hgetall(key)
  }

  public hdel({ key, field }: HdelOptions): Promise<number> {
    if (field) {
      return this.redis.hdel(key, field as KeyType)
    }
    return this.del(key)
  }

  public multi(commands: any[][]): Promise<[Error | null, any][]> {
    return this.redis.multi(commands).exec()
  }

  public incr(key: string): Promise<number> {
    return this.redis.incr(key)
  }

  public del(key: string): Promise<number> {
    return this.redis.del(key)
  }
}
