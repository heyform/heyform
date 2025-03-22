/**
 * @program: heyform-serves
 * @description: Team custom domains
 * @author: mufeng
 * @date: 11/23/21 1:25 PM
 **/

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({
  timestamps: true
})
export class CustomDomainModel extends Document {
  @Prop({ required: true })
  teamId: string

  @Prop({ required: true, unique: true })
  domain: string

  @Prop({ required: true, default: false })
  active: boolean
}

export const CustomDomainSchema = SchemaFactory.createForClass(
  CustomDomainModel
)

CustomDomainSchema.index({ teamId: 1, domain: 1 }, { unique: false })
