import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum IntegrationStatusEnum {
  PENDING = 0,
  ACTIVE = 1,
  DISABLED = 2,
  // The app's OAuth2 grant was revoked or expired; the form owner has to
  // connect the account again before deliveries resume
  NEEDS_RECONNECT = 3
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

  // The team's connected account this integration delivers with, for apps
  // with `auth.type === 'oauth2'` (IntegrationConnectionModel)
  @Prop()
  connectionId?: string

  // Encrypted with encryptSecret(), for apps with `auth.type === 'apiKey'`.
  // Never returned to the client; apiKeyHint is shown instead.
  @Prop()
  apiKey?: string

  @Prop()
  apiKeyHint?: string

  @Prop({
    type: Number,
    required: true,
    default: IntegrationStatusEnum.ACTIVE
  })
  status: IntegrationStatusEnum
}

export const IntegrationSchema = SchemaFactory.createForClass(IntegrationModel)

IntegrationSchema.index({ formId: 1, appId: 1 }, { unique: true })
IntegrationSchema.index({ connectionId: 1 }, { sparse: true })
