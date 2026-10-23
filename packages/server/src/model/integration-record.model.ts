import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum IntegrationRecordStatusEnum {
  SUCCEEDED = 1,
  FAILED = 2
}

// Records are a recent-activity log, not an archive
export const INTEGRATION_RECORD_TTL_DAYS = 30

/**
 * One delivery attempt of a submission to an integration, written by the
 * integration queue so form owners can see what was sent and what failed.
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

  // 1-based number of this attempt, out of maxAttempts
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
IntegrationRecordSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: INTEGRATION_RECORD_TTL_DAYS * 24 * 60 * 60 }
)
