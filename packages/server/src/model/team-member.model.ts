import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum TeamRoleEnum {
  OWNER,
  ADMIN,
  COLLABORATOR,
  MEMBER
}

@Schema()
export class TeamMemberModel extends Document {
  @Prop({ required: true, index: true })
  teamId: string

  @Prop({ required: true, index: true })
  memberId: string

  @Prop({ type: Number, required: true, enum: Object.values(TeamRoleEnum) })
  role: TeamRoleEnum

  @Prop()
  lastSeenAt?: number
}

export const TeamMemberSchema = SchemaFactory.createForClass(TeamMemberModel)

TeamMemberSchema.index({ teamId: 1, memberId: 1 }, { unique: true })
