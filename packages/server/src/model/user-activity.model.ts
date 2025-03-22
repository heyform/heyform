import { GeoLocation } from '@heyforms/nestjs'
import { UserAgent } from '@heyforms/nestjs'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum UserActivityKindEnum {
  LOGIN = 1,
  SIGN_UP,
  RESET_PASSWORD,
  CHANGE_EMAIL,
  UPDATE_PASSWORD
}

@Schema({
  timestamps: true
})
export class UserActivityModel extends Document {
  @Prop({ type: String, required: true })
  kind: UserActivityKindEnum

  @Prop({ required: true, index: true })
  userId: string

  @Prop({ required: true })
  deviceId: string

  @Prop({ required: true })
  ip: string

  @Prop()
  geoLocation: GeoLocation

  @Prop()
  userAgent: UserAgent

  @Prop()
  isConfirm?: boolean

  @Prop({ type: Map })
  addition?: Record<string, any>
}

export const UserActivitySchema = SchemaFactory.createForClass(
  UserActivityModel
)
