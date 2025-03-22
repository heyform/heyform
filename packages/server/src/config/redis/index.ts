import { REDIS_DB, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from '@environments'
import {
  RedisModuleOptions,
  RedisModuleOptionsFactory
} from '@svtslv/nestjs-ioredis/dist/redis.interfaces'

export class RedisService implements RedisModuleOptionsFactory {
  createRedisModuleOptions(): Promise<RedisModuleOptions> | RedisModuleOptions {
    return {
      config: {
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD,
        db: REDIS_DB
      }
    }
  }
}
