import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

import { date, nanoid } from '@heyform-inc/utils'

import { INVITE_CODE_EXPIRE_DAYS } from '@environments'

import { ProjectModel } from './project.model'

@Schema({
  timestamps: true
})
export class TeamModel extends Document {
  @Prop({ default: () => nanoid(8) })
  _id: string

  @Prop({ required: true })
  name: string

  @Prop({ required: true })
  ownerId: string

  @Prop()
  avatar?: string

  @Prop({ default: () => nanoid(), unique: true })
  inviteCode: string

  // team invite code expire at unix timestamp
  @Prop({
    default: () => {
      return date().add(INVITE_CODE_EXPIRE_DAYS, 'day').unix()
    }
  })
  inviteCodeExpireAt: number

  @Prop({ default: true })
  allowJoinByInviteLink: boolean

  @Prop()
  inviteLinkResetAt?: number

  @Prop()
  storageQuota?: number

  /**
   * Attach references to the team model for easy query,
   * will not be used as a column in the team schema
   */
  // Projects
  projects?: ProjectModel[]

  // Member count
  memberCount?: number

  // If the user is team owner
  isOwner?: boolean
}

export const TeamSchema = SchemaFactory.createForClass(TeamModel)
