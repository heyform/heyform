import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { IsEmail, IsOptional, Length, Matches } from 'class-validator'

import { LowerCase } from '@utils'

@InputType()
export class CdnTokenInput {
  @Field()
  mime: string

  @Field()
  filename: string
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  @IsOptional()
  name?: string

  @Field({ nullable: true })
  @IsOptional()
  avatar?: string

  @Field({ nullable: true })
  @IsOptional()
  restoreGravatar?: boolean
}

@InputType()
export class ChangeEmailCodeInput {
  @Field(type => LowerCase)
  @IsEmail(undefined, {
    message: 'Invalid email address'
  })
  email: string
}

@InputType()
export class UpdateEmailInput extends ChangeEmailCodeInput {
  @Field()
  code: string
}

@InputType()
export class VerifyEmailInput {
  @Field()
  code: string
}

@InputType()
export class UpdateUserPasswordInput {
  @Field()
  currentPassword: string

  @Field()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[!#$%&()*+\-,.\/\\:<=>?@\[\]^_{|}~0-9a-zA-Z]{8,}$/, {
    message: 'Invalid password'
  })
  @Length(8, 100, {
    message: 'Invalid password'
  })
  newPassword: string
}

@ObjectType()
export class CdnTokenType {
  @Field()
  token: string

  @Field()
  urlPrefix: string

  @Field()
  key: string
}

@ObjectType()
export class UserDetailType {
  @Field()
  id: string

  @Field()
  name: string

  @Field()
  email: string

  @Field({ nullable: true })
  avatar?: string

  @Field({ nullable: true })
  lang?: string

  @Field()
  isEmailVerified: boolean

  @Field()
  isSocialAccount: boolean

  @Field({ nullable: true })
  isDeletionScheduled?: boolean

  @Field({ nullable: true })
  deletionScheduledAt?: number
}

@InputType()
export class VerifyUserDeletionInput {
  @Field()
  code: string
}
