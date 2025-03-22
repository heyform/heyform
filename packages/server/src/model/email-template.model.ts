import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { UserLangEnum } from './user.model'

@Schema()
export class EmailTemplateModel extends Document {
  @Prop({ required: true })
  name: string

  @Prop({
    type: String,
    default: UserLangEnum.EN,
    enum: Object.values(UserLangEnum)
  })
  lang: UserLangEnum

  @Prop({ required: true })
  subject: string

  @Prop({ required: true })
  html: string

  @Prop()
  text: string

  @Prop()
  from: string
}

export const EmailTemplateSchema = SchemaFactory.createForClass(
  EmailTemplateModel
)

EmailTemplateSchema.index({ name: 1, lang: 1 }, { unique: true })
