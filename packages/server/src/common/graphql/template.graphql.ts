import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { IsOptional, Max } from 'class-validator'

import { FormField, FormKindEnum, InteractiveModeEnum } from '@heyform-inc/shared-types-enums'

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
  templateId?: string

  @Field({ nullable: true })
  templateSlug?: string
}

@ObjectType()
export class TemplateType {
  @Field()
  id: string

  @Field()
  name: string

  @Field({ nullable: true })
  slug?: string

  @Field({ nullable: true })
  thumbnail?: string

  @Field()
  category: string

  @Field({ nullable: true })
  description?: string

  @Field(type => Number)
  interactiveMode: InteractiveModeEnum

  @Field(type => Number)
  kind: FormKindEnum

  @Field(type => ThemeSettingsType, { nullable: true })
  themeSettings?: ThemeSettingsType

  @Field()
  usedCount: number

  @Field({ nullable: true })
  timeSaving?: string

  @Field({ nullable: true })
  timeToComplete?: string

  @Field()
  published?: boolean
}

@ObjectType()
export class TemplateDetailType extends TemplateType {
  @Field(type => [FormFieldType], { nullable: true })
  fields?: FormField[]

  @Field({ nullable: true })
  fieldUpdateAt?: number
}

@InputType()
export class UseTemplateInput extends ProjectDetailInput {
  @Field()
  templateId: string
}
