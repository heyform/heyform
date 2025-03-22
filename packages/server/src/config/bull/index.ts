import {
  BULL_JOB_ATTEMPTS,
  BULL_JOB_BACKOFF_DELAY,
  BULL_JOB_BACKOFF_TYPE,
  BULL_JOB_TIMEOUT,
  REDIS_DB,
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT
} from '@environments'
import { BullModuleOptions } from '@nestjs/bull'
import { ms } from '@heyform-inc/utils'

export const BullOptionsFactory = ():
  | BullModuleOptions
  | Promise<BullModuleOptions> => ({
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    db: REDIS_DB
  },
  defaultJobOptions: {
    attempts: BULL_JOB_ATTEMPTS,
    timeout: ms(BULL_JOB_TIMEOUT),
    removeOnComplete: true,
    removeOnFail: true,
    backoff: {
      delay: BULL_JOB_BACKOFF_DELAY,
      type: BULL_JOB_BACKOFF_TYPE
    }
  }
})
