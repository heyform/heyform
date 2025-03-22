import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({
  timestamps: true
})
export class TeamInvitationModel extends Document {
  @Prop({ required: true })
  teamId: string

  @Prop({ required: true })
  email: string

  @Prop({ required: true })
  expireAt: number
}

export const TeamInvitationSchema = SchemaFactory.createForClass(
  TeamInvitationModel
)

// Unique constraint on name and lang
TeamInvitationSchema.index({ teamId: 1, email: 1 }, { unique: true })
