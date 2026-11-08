import { IsEmail, IsOptional, Length, Matches } from 'class-validator'

import { UserLangEnum } from '@model'
import { Field, InputType, ObjectType } from '@nestjs/graphql'
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

  @Field(type => String, { nullable: true })
  @IsOptional()
  lang?: UserLangEnum
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

  @Field()
  currentPassword: string
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
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[!#$%&()*+\-,./\\:<=>?@[\]^_{|}~0-9a-zA-Z]{8,}$/, {
    message: 'Invalid password'
  })
  @Length(8, 100, {
    message: 'Invalid password'
  })
  newPassword: string
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

  @Field(type => String, { nullable: true })
  lang?: UserLangEnum

  @Field()
  isEmailVerified: boolean

  @Field()
  isSocialAccount: boolean

  // The identity provider owns the name (OIDC_SYNC_NAME). Only userDetail resolves it; other
  // queries returning this type, like projectMembers, leave it null.
  @Field({ nullable: true })
  isNameManaged?: boolean

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
