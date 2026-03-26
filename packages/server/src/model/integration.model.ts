import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum IntegrationStatusEnum {
  PENDING = 0,
  ACTIVE = 1,
  DISABLED = 2
}

@Schema({
  timestamps: true
})
export class IntegrationModel extends Document {
  @Prop({ required: true })
  formId: string

  @Prop({ required: true })
  appId: string

  @Prop({ type: Map, default: {} })
  config?: Record<string, any>

  @Prop()
  thirdPartyOauthId?: string

  @Prop({
    type: Number,
    required: true,
    enum: Object.values(IntegrationStatusEnum).filter(v => typeof v === 'number'),
    default: IntegrationStatusEnum.ACTIVE
  })
  status: IntegrationStatusEnum
}

export const IntegrationSchema = SchemaFactory.createForClass(IntegrationModel)

IntegrationSchema.index({ formId: 1, appId: 1 }, { unique: true })
