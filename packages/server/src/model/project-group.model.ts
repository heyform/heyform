import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({
  timestamps: true
})
export class ProjectGroupModel extends Document {
  @Prop({ required: true, index: true })
  projectId: string

  @Prop({ required: true, index: true })
  groupId: string
}

export const ProjectGroupSchema = SchemaFactory.createForClass(ProjectGroupModel)

ProjectGroupSchema.index({ projectId: 1, groupId: 1 }, { unique: true })
