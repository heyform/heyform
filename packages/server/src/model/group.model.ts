import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({
  timestamps: true
})
export class GroupModel extends Document {
  @Prop({ required: true, index: true })
  teamId: string

  @Prop({ required: true })
  name: string

  @Prop()
  avatar?: string

  // Contacts count
  contactCount?: number
}

export const GroupSchema = SchemaFactory.createForClass(GroupModel)
