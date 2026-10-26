import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum FormAnalyticRangeEnum {
  WEEK = '7d',
  MONTH = '1m',
  THREE_MONTH = '3m',
  SIX_MONTH = '6m',
  YEAR = '1y'
}

// The formAnalytic query caches its result per range. Anything that changes the
// numbers (a visit, a submission) clears every range for the form.
export function formAnalyticCacheKey(formId: string, range: FormAnalyticRangeEnum): string {
  return `form:${formId}:analytic:${range}`
}

export function formAnalyticCacheKeys(formId: string): string[] {
  return Object.values(FormAnalyticRangeEnum).map(range => formAnalyticCacheKey(formId, range))
}

/**
 * Drop the cached formAnalytic results for a form, so the overview reflects a
 * visit or submission straight away instead of up to 10 minutes later. Best
 * effort: a cache miss only costs a recompute, so a Redis error must not fail
 * the visit or the submission that triggered it.
 */
export async function clearFormAnalyticCache(
  redisService: { del(key: string): Promise<unknown> },
  formId: string
): Promise<void> {
  try {
    await Promise.all(formAnalyticCacheKeys(formId).map(key => redisService.del(key)))
  } catch {
    // ignore, see above
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
