import { Field, InputType } from '@nestjs/graphql'
import { IsEmail, IsOptional, Length, Matches } from 'class-validator'

import { LowerCase } from '@utils'

@InputType()
export class SendResetPasswordEmailInput {
  @Field(type => LowerCase)
  @IsEmail(undefined, {
    message: 'Invalid email address'
  })
  email: string
}

@InputType()
export class LoginInput extends SendResetPasswordEmailInput {
  @Field()
  @Length(8, 100, {
    message: 'Invalid password'
  })
  password: string
}

@InputType()
export class SignUpInput extends SendResetPasswordEmailInput {
  @Field()
  @Length(1, 100, {
    message: 'User name is limited to 100 characters'
  })
  name: string

  @Field()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[!#$%&()*+\-,.\/\\:<=>?@\[\]^_{|}~0-9a-zA-Z]{8,}$/, {
    message: 'Invalid password'
  })
  @Length(8, 100, {
    message: 'Invalid password'
  })
  password: string

  @Field({ nullable: true })
  @IsOptional()
  teamId?: string

  @Field({ nullable: true })
  @IsOptional()
  inviteCode?: string
}

@InputType()
export class ResetPasswordInput extends SendResetPasswordEmailInput {
  @Field()
  code: string

  @Field()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[!#$%&()*+\-,.\/\\:<=>?@\[\]^_{|}~0-9a-zA-Z]{8,}$/, {
    message: 'Invalid password'
  })
  @Length(8, 100, {
    message: 'Invalid password'
  })
  password: string
}
