import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({
  timestamps: true
})
export class UserModel extends Document {
  @Prop({ required: true })
  name: string

  @Prop()
  email?: string

  @Prop()
  password?: string

  @Prop()
  avatar?: string

  @Prop()
  phoneNumber?: string

  @Prop()
  address?: string

  @Prop()
  note?: string

  @Prop({ default: 'en' })
  lang?: string

  @Prop({ default: false })
  isEmailVerified?: boolean

  @Prop({ default: false })
  isDeletionScheduled?: boolean

  @Prop({ default: 0 })
  deletionScheduledAt?: number

  /**
   * Check if user is register from social login,
   * isSocialAccount will not be used as a column in the user schema
   */
  isSocialAccount?: boolean
}

export const UserSchema = SchemaFactory.createForClass(UserModel)
