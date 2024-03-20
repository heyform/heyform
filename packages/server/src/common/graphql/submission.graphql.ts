import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator'
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json'

import {
  FieldKindEnum,
  Property,
  SubmissionCategoryEnum,
  Variable
} from '@heyform-inc/shared-types-enums'

import { FormDetailInput, PropertyInput, PropertyType } from './form.graphql'

@InputType()
export class DeleteSubmissionInput extends FormDetailInput {
  @Field(type => [String])
  submissionIds: string[]
}

@InputType()
class AnswerInput {
  @Field()
  id: string

  @Field(type => String, { nullable: true })
  kind?: FieldKindEnum

  @Field(type => PropertyInput, { nullable: true })
  properties?: Property

  @Field(type => GraphQLJSON)
  value: any
}

@InputType()
export class SubmissionAnswersInput extends FormDetailInput {
  @Field()
  fieldId: string

  @Field({ nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number

  @Field({ nullable: true, defaultValue: 30 })
  @IsOptional()
  @IsNumber()
  @Max(30)
  @Min(10)
  limit?: number
}

@InputType()
export class UpdateSubmissionAnswerInput extends FormDetailInput {
  @Field()
  submissionId: string

  @Field(type => AnswerInput)
  answer: AnswerInput
}

@InputType()
export class SubmissionsInput extends FormDetailInput {
  @Field(type => String, { nullable: true })
  @IsOptional()
  @IsEnum(Object.values(SubmissionCategoryEnum))
  category?: SubmissionCategoryEnum

  @Field({ nullable: true })
  @IsOptional()
  labelId?: string

  @Field({ nullable: true })
  @IsOptional()
  keyword?: string

  @Field({ nullable: true, defaultValue: 1 })
  @IsOptional()
  page?: number

  @Field({ nullable: true, defaultValue: 30 })
  @IsOptional()
  @Max(30)
  @Min(10)
  limit?: number
}

@InputType()
export class UpdateSubmissionsCategoryInput extends FormDetailInput {
  @Field(type => [String])
  submissionIds: string[]

  @Field(type => String)
  @IsEnum(Object.values(SubmissionCategoryEnum))
  category: SubmissionCategoryEnum
}

@ObjectType()
export class AnswerType {
  @Field()
  id: string

  @Field(type => String)
  kind: FieldKindEnum

  @Field()
  title: string

  @Field({ nullable: true })
  description?: string

  @Field(type => PropertyType)
  properties: Property

  @Field(type => GraphQLJSONObject)
  value: any
}

@ObjectType()
export class SubmissionCategoryType {
  @Field()
  id: string

  @Field()
  unviewed: number
}

@ObjectType()
export class SubmissionType {
  @Field()
  id: string

  @Field({ nullable: true })
  category: string

  @Field({ nullable: true })
  title: string

  @Field(type => [GraphQLJSONObject])
  answers: Record<string, any>[]

  @Field(type => [GraphQLJSONObject], { nullable: true })
  variables?: Variable[]

  @Field()
  endAt: number
}

@ObjectType()
export class SubmissionsType {
  @Field()
  total: number

  @Field(type => [SubmissionType])
  submissions: SubmissionType[]
}

@ObjectType()
class Answer2Type {
  @Field({ nullable: true })
  submissionId?: string

  @Field()
  kind: string

  @Field(type => GraphQLJSON, { nullable: true })
  value?: any

  @Field()
  endAt: number
}

@ObjectType()
export class SubmissionAnswersType {
  @Field()
  total: number

  @Field(type => [Answer2Type])
  answers: Answer2Type[]
}
