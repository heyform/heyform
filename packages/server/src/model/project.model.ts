import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

import { nanoid } from '@heyform-inc/utils'

@Schema({
  timestamps: true
})
export class ProjectModel extends Document {
  @Prop({ default: () => nanoid(8) })
  _id: string

  @Prop({ required: true, index: true })
  teamId: string

  @Prop({ required: true })
  name: string

  @Prop()
  icon?: string

  @Prop({ required: true })
  ownerId: string

  @Prop()
  avatar?: string

  /**
   * Attach references to the project model for easy query,
   * will not be used as a column in the project schema
   */
  members?: string[]

  // Form count
  formCount?: number

  // If the user is team owner
  isOwner?: boolean
}

export const ProjectSchema = SchemaFactory.createForClass(ProjectModel)
