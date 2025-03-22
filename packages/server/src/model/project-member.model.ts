import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema()
export class ProjectMemberModel extends Document {
  @Prop({ required: true, index: true })
  projectId: string

  @Prop({ required: true, index: true })
  memberId: string
}

export const ProjectMemberSchema = SchemaFactory.createForClass(
  ProjectMemberModel
)

ProjectMemberSchema.index({ projectId: 1, memberId: 1 }, { unique: true })
