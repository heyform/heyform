import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export enum FailedTaskStatusEnum {
  PENDING = 1,
  REQUEUE,
  DISCARD
}

@Schema()
export class FailedTaskModel extends Document {
  @Prop({ type: Map, required: true })
  data: any

  @Prop()
  failedReason?: string

  @Prop({
    type: Number,
    required: true,
    default: FailedTaskStatusEnum.PENDING,
    enum: Object.values(FailedTaskStatusEnum)
  })
  status: FailedTaskStatusEnum
}

export const FailedTaskSchema = SchemaFactory.createForClass(FailedTaskModel)
