import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum TeamActivityKindEnum {
  CREATE_TEAM = 1,
  JOIN_TEAM,
  LEAVE_TEAM,
  CREATE_FORM,
  PUBLISH_FORM,
  DELETE_FORM,
  UPDATE_FORM_SETTINGS,
  UPDATE_FORM_FIELDS,
  CREATE_INTEGRATION,
  UPDATE_INTEGRATION,
  UPDATE_USER_ROLE,
  UPDATE_SUBMISSION,
  DELETE_SUBMISSION
}

@Schema({
  timestamps: true
})
export class TeamActivityModel extends Document {
  @Prop({ required: true, index: true })
  teamId: string

  @Prop({ required: true })
  memberId: string

  @Prop({
    type: Number,
    required: true,
    enum: Object.values(TeamActivityKindEnum)
  })
  kind: TeamActivityKindEnum

  @Prop({ type: Map })
  attributes?: Record<string, any>
}

export const TeamActivitySchema = SchemaFactory.createForClass(
  TeamActivityModel
)
