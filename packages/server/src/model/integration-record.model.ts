import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

import { IntegrationModel } from './integration.model'

@Schema({
  timestamps: true
})
export class IntegrationRecordModel extends IntegrationModel {
  @Prop({ required: true })
  integrationId: string

  @Prop({ type: Map })
  response?: Record<string, any>
}

export const IntegrationRecordSchema = SchemaFactory.createForClass(IntegrationRecordModel)
