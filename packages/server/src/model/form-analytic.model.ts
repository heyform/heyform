import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import { Document } from 'mongoose'

export enum FormAnalyticRangeEnum {
  WEEK = '7d',
  MONTH = '1m',
  THREE_MONTH = '3m',
  SIX_MONTH = '6m',
  YEAR = '1y'
}

// The formAnalytic query caches its result per range, under a key that carries
// the form's cache generation. Anything that changes the numbers (a visit, a
// submission) replaces the generation instead of deleting keys, so a query that
// read the old generation and finishes late writes to a key nobody reads again.
const GENERATION_TTL_SECONDS = 24 * 60 * 60
export const FORM_ANALYTIC_CACHE_CLEAR_TIMEOUT_MS = 500

interface FormAnalyticCacheRedis {
  get(key: string): Promise<string | null>
  multi(commands: any[][]): Promise<unknown>
}

export function formAnalyticGenerationKey(formId: string): string {
  return `form:${formId}:analytic:generation`
}

export function formAnalyticCacheKey(
  formId: string,
  range: FormAnalyticRangeEnum,
  generation: string
): string {
  return `form:${formId}:analytic:${range}:${generation}`
}

export async function getFormAnalyticCacheGeneration(
  redisService: Pick<FormAnalyticCacheRedis, 'get'>,
  formId: string
): Promise<string> {
  return (await redisService.get(formAnalyticGenerationKey(formId))) ?? '0'
}

/**
 * Invalidate the cached formAnalytic results for a form, so the overview
 * reflects a visit or submission straight away instead of up to 10 minutes
 * later. Best effort and bounded: a stale overview costs less than a visit or
 * submission that fails or hangs, so a Redis error is ignored and an
 * unresponsive Redis is given up on after the timeout.
 *
 * Each invalidation uses a unique generation, so expiring the generation cannot
 * reuse a cached result written shortly before its expiry.
 */
export async function clearFormAnalyticCache(
  redisService: Pick<FormAnalyticCacheRedis, 'multi'>,
  formId: string,
  timeoutMs = FORM_ANALYTIC_CACHE_CLEAR_TIMEOUT_MS
): Promise<void> {
  const key = formAnalyticGenerationKey(formId)
  const bump = Promise.resolve()
    .then(() => redisService.multi([['set', key, randomUUID(), 'EX', GENERATION_TTL_SECONDS]]))
    .then(
      () => undefined,
      () => undefined
    )

  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<void>(resolve => {
    timer = setTimeout(resolve, timeoutMs)
    timer.unref?.()
  })

  try {
    await Promise.race([bump, timeout])
  } finally {
    clearTimeout(timer)
  }
}

@Schema({
  timestamps: true
})
export class FormAnalyticModel extends Document {
  @Prop({ required: true, index: true })
  formId: string

  @Prop({ required: true })
  totalVisits: number
}

export const FormAnalyticSchema = SchemaFactory.createForClass(FormAnalyticModel)
