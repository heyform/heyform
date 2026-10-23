import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum IntegrationConnectionStatusEnum {
  ACTIVE = 1,
  // The provider rejected the grant (revoked or expired), or the tokens can't
  // be read; someone has to connect the account again
  NEEDS_RECONNECT = 2
}

/**
 * An account at an OAuth2 provider, connected once for a team (workspace) and
 * shared by the integrations of any of its forms. One per team, provider and
 * account: connecting the same account again updates it.
 */
@Schema({
  timestamps: true
})
export class IntegrationConnectionModel extends Document {
  @Prop({ required: true })
  teamId: string

  // Id of the provider in oauth2-providers.ts, e.g. `example`
  @Prop({ required: true })
  provider: string

  // The provider's stable id for the account (OpenID Connect `sub`)
  @Prop({ required: true })
  accountId: string

  @Prop()
  accountEmail?: string

  @Prop()
  accountName?: string

  // Scopes the account has granted, across every app that connected it
  @Prop({ type: [String], default: [] })
  scopes: string[]

  // accessToken and refreshToken encrypted with encryptSecret(), and
  // expiresAt in milliseconds
  @Prop({ type: Map, default: {} })
  tokens: Record<string, any>

  // Incremented on every token change, so concurrent refreshes and reconnects
  // can tell whether the tokens they read are still current
  @Prop({ default: 0 })
  tokenVersion: number

  @Prop({
    type: Number,
    required: true,
    default: IntegrationConnectionStatusEnum.ACTIVE
  })
  status: IntegrationConnectionStatusEnum

  // Why it needs reconnecting, shown to the team
  @Prop()
  statusReason?: string

  // User who first connected the account
  @Prop({ required: true })
  createdBy: string

  createdAt?: Date
}

export const IntegrationConnectionSchema = SchemaFactory.createForClass(IntegrationConnectionModel)

IntegrationConnectionSchema.index({ teamId: 1, provider: 1, accountId: 1 }, { unique: true })
// Whether another team holds a connection to the same account
IntegrationConnectionSchema.index({ provider: 1, accountId: 1 })
