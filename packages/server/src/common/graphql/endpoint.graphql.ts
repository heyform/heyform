import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { IsOptional, IsString } from 'class-validator'
import { GraphQLJSONObject } from 'graphql-type-json'

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
export class CompleteSubmissionInput {
  @Field()
  formId: string

  @Field(type => GraphQLJSONObject)
  answers: Record<string, any>

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
  url: string

  @Field()
  size: number
}
