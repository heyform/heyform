import { AddressValue } from '@heyform-inc/shared-types-enums'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { GroupModel } from './group.model'

@Schema({
  timestamps: true
})
export class ContactModel extends Document {
  @Prop({ required: true })
  teamId: string

  @Prop({ required: true })
  fullName: string

  @Prop({ required: true })
  email: string

  @Prop()
  jobTitle?: string

  @Prop()
  avatar?: string

  @Prop()
  phoneNumber?: string

  @Prop({ type: Map, default: {} })
  address?: AddressValue

  @Prop()
  note?: string

  @Prop({ type: [{ type: Types.ObjectId, ref: GroupModel.name }] })
  groups?: GroupModel[]
}

export const ContactSchema = SchemaFactory.createForClass(ContactModel)
ContactSchema.index({ teamId: 1, email: 1 }, { unique: true })
