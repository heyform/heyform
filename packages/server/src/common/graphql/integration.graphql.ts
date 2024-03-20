import { Field, InputType } from '@nestjs/graphql'
import { IsEmail, IsEnum, IsOptional, IsUrl } from 'class-validator'

import { IntegrationStatusEnum } from '@model'

import { FormDetailInput } from './form.graphql'

@InputType()
export class ThirdPartyInput extends FormDetailInput {
  @Field()
  appId: string
}

@InputType()
export class ThirdPartyOAuthInput extends ThirdPartyInput {
  @Field()
  code: string
}

@InputType()
class EmailSettingsInput {
  @Field()
  @IsEmail()
  email: string
}

@InputType()
class GoogleAnalyticsSettingsInput {
  @Field()
  trackingCode: string
}

@InputType()
class WebhookSettingsInput {
  @Field()
  @IsUrl()
  webhook: string
}

@InputType()
export class UpdateIntegrationInput extends ThirdPartyInput {
  @Field(type => EmailSettingsInput, { nullable: true })
  @IsOptional()
  email?: EmailSettingsInput

  @Field(type => GoogleAnalyticsSettingsInput, { nullable: true })
  @IsOptional()
  googleanalytics?: GoogleAnalyticsSettingsInput

  @Field(type => GoogleAnalyticsSettingsInput, { nullable: true })
  @IsOptional()
  facebookpixel?: GoogleAnalyticsSettingsInput

  @Field(type => WebhookSettingsInput, { nullable: true })
  @IsOptional()
  webhook?: WebhookSettingsInput
}

@InputType()
export class UpdateIntegrationStatusInput extends ThirdPartyInput {
  @Field(type => Number)
  @IsEnum(IntegrationStatusEnum)
  status: IntegrationStatusEnum
}
