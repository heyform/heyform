import { FormField } from '@heyform-inc/shared-types-enums'
import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { IsOptional, Max } from 'class-validator'
import { FormFieldType, ThemeSettingsType } from './form.graphql'
import { ProjectDetailInput } from './project.graphql'

@InputType()
export class TemplatesInput {
  @Field({ nullable: true })
  @IsOptional()
  keyword?: string

  @Field({ nullable: true })
  @IsOptional()
  @Max(10)
  limit?: number
}

@InputType()
export class TemplateDetailInput {
  @Field({ nullable: true })
  templateId: string
}

@ObjectType()
export class TemplateType {
  @Field()
  id: string

  @Field({ nullable: true })
  recordId?: string

  @Field()
  name: string

  @Field({ nullable: true })
  slug?: string

  @Field({ nullable: true })
  thumbnail?: string

  @Field({ nullable: true })
  category?: string

  @Field(type => [FormFieldType], { nullable: true })
  fields?: FormField[]

  @Field(type => ThemeSettingsType, { nullable: true })
  themeSettings?: ThemeSettingsType

  @Field({ nullable: true })
  used?: number
}

@InputType()
export class UseTemplateInput extends ProjectDetailInput {
  @Field()
  templateId: string

  @Field()
  recordId: string
}
