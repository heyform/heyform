import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

import { BrandKitModel } from './brand-kit.model'
import { ProjectModel } from './project.model'
import { INVITE_CODE_EXPIRE_DAYS } from '@environments'
import { date, nanoid } from '@heyform-inc/utils'

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

  @Prop({ type: [String], default: undefined })
  ownerIds?: string[]

  @Prop()
  avatar?: string

  @Prop()
  removeBranding?: boolean

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

  // Team brand kits
  brandKits?: BrandKitModel[]

  // If the user is team owner
  isOwner?: boolean
}

export const TeamSchema = SchemaFactory.createForClass(TeamModel)

export function getTeamOwnerIds(team: Pick<TeamModel, 'ownerId' | 'ownerIds'>): string[] {
  return team.ownerIds ?? [team.ownerId]
}

export function isTeamOwner(
  team: Pick<TeamModel, 'ownerId' | 'ownerIds'>,
  memberId: string
): boolean {
  return getTeamOwnerIds(team).includes(memberId)
}
