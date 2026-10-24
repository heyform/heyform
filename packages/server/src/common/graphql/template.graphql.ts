import {
  FormField,
  FormKindEnum,
  FormModel,
  InteractiveModeEnum
} from '@heyform-inc/shared-types-enums'
import { IsOptional, IsString, Max, MaxLength } from 'class-validator'

import { FormFieldType, ThemeSettingsType } from './form.graphql'
import { ProjectDetailInput } from './project.graphql'
import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { GraphQLJSONObject } from 'graphql-type-json'

@InputType()
export class TemplatesInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
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
  @Field(type => [GraphQLJSONObject], { nullable: true })
  logics?: FormModel['logics']

  @Field(type => [GraphQLJSONObject], { nullable: true })
  variables?: FormModel['variables']

  @Field(type => GraphQLJSONObject, { nullable: true })
  translations?: FormModel['translations']

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
