import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { IsOptional, IsString } from 'class-validator'
import { GraphQLJSONObject } from 'graphql-type-json'
import { CdnTokenInput } from './user.graphql'
import { HiddenFieldAnswer } from '@heyform-inc/shared-types-enums'

@InputType()
export class UploadFormFileInput extends CdnTokenInput {
  @Field()
  formId: string
}

@InputType()
export class UploadFormSignatureInput {
  @Field()
  formId: string

  @Field()
  signature: string
}

@InputType()
export class OpenFormInput {
  @Field()
  formId: string
}

@InputType()
export class VerifyPasswordInput {
  @Field()
  formId: string

  @Field()
  password: string
}

@InputType()
class HiddenFieldAnswerInput {
  @Field()
  id: string

  @Field()
  name: string

  @Field({ nullable: true })
  value?: string
}

@InputType()
export class CompleteSubmissionInput {
  @Field()
  formId: string

  @Field({ nullable: true })
  @IsOptional()
  contactId?: string

  // TODO - add AnswerType
  @Field(type => GraphQLJSONObject)
  answers: Record<string, any>

  @Field(type => [HiddenFieldAnswerInput])
  hiddenFields: HiddenFieldAnswer[]

  @Field({ nullable: true })
  partialSubmission?: boolean

  @Field()
  openToken: string

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  passwordToken?: string

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  recaptchaToken?: string

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  lotNumber?: string

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  captchaOutput?: string

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  passToken?: string

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  genTime?: string
}

@ObjectType()
export class CompleteSubmissionType {
  @Field({ nullable: true })
  clientSecret?: string
}

@ObjectType()
export class InitGeetestCaptchaType {
  @Field()
  challenge: string

  @Field()
  gt: string

  @Field()
  new_captcha: boolean

  @Field()
  success: number
}

@ObjectType()
export class UploadFormFileType {
  @Field()
  filename: string

  @Field()
  cdnKey: string

  @Field()
  cdnUrlPrefix: string

  @Field()
  size: number
}
