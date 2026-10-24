import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum IntegrationRecordStatusEnum {
  // Not delivered yet: the integration needs reconnecting. The submission is
  // queued again once it's reconnected, and the record is removed.
  WAITING = 0,
  SUCCEEDED = 1,
  FAILED = 2
}

// Delivery attempts are a recent-activity log, not an archive
export const INTEGRATION_RECORD_TTL_DAYS = 30

// Waiting records don't expire, since they stand for submissions that haven't
// been delivered. This caps how many one integration can hold while it waits
// to be reconnected; later submissions are recorded as failed instead.
export const MAX_WAITING_RECORDS = 1000

/**
 * One delivery attempt of a submission to an integration, written by the
 * integration queue so form owners can see what was sent and what failed, or a
 * submission waiting for the integration to be reconnected.
 */
@Schema({
  timestamps: true
})
export class IntegrationRecordModel extends Document {
  @Prop({ required: true })
  formId: string

  @Prop({ required: true })
  appId: string

  @Prop({ required: true })
  integrationId: string

  @Prop({ required: true })
  submissionId: string

  @Prop({ type: Number, required: true })
  status: IntegrationRecordStatusEnum

  // 1-based number of this attempt, out of maxAttempts. For a waiting record,
  // the attempts made before it had to wait (0 if none).
  @Prop({ required: true })
  attempt: number

  @Prop({ required: true })
  maxAttempts: number

  // Failed, and the queue will try again
  @Prop({ default: false })
  willRetry: boolean

  // Error message of a failed attempt, shortened
  @Prop()
  error?: string

  createdAt?: Date
}

export const IntegrationRecordSchema = SchemaFactory.createForClass(IntegrationRecordModel)

IntegrationRecordSchema.index({ integrationId: 1, createdAt: -1 })
IntegrationRecordSchema.index({ formId: 1, appId: 1 })

// A submission waits at most once per integration
IntegrationRecordSchema.index(
  { integrationId: 1, submissionId: 1 },
  { unique: true, partialFilterExpression: { status: IntegrationRecordStatusEnum.WAITING } }
)

// Only attempts expire. MongoDB 4.4 partial indexes don't support $in, hence $gte.
IntegrationRecordSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: INTEGRATION_RECORD_TTL_DAYS * 24 * 60 * 60,
    partialFilterExpression: { status: { $gte: IntegrationRecordStatusEnum.SUCCEEDED } }
  }
)
