import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'

import { FormDetailInput } from './form.graphql'
import { TeamDetailInput } from './team.graphql'
import { IntegrationStatusEnum } from '@model'
import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { GraphQLJSONObject } from 'graphql-type-json'

@InputType()
export class IntegrationInput extends FormDetailInput {
  @Field()
  appId: string
}

@InputType()
export class IntegrationOAuthInput extends IntegrationInput {
  @Field()
  code: string
}

@InputType()
export class UpdateIntegrationInput extends IntegrationInput {
  @Field(type => GraphQLJSONObject)
  config: Record<string, any>

  // For apps with `auth.type === 'apiKey'`. Omit to keep the saved key.
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  apiKey?: string

  // For apps with `auth.type === 'oauth2'`: one of the team's connected
  // accounts. Omit to keep the current one.
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  connectionId?: string
}

// Loads the options of a select setting with `loadOptions`
@InputType()
export class IntegrationSettingOptionsInput extends IntegrationInput {
  // Name of the setting
  @Field()
  @IsString()
  @MaxLength(64)
  setting: string

  // The values in the settings form
  @Field(type => GraphQLJSONObject)
  config: Record<string, any>

  // As in UpdateIntegrationInput: the key or account being picked. Omit to
  // use the saved one.
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  apiKey?: string

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  connectionId?: string
}

@InputType()
export class IntegrationConnectionInput extends TeamDetailInput {
  @Field()
  connectionId: string
}

@ObjectType()
export class IntegrationConnectionFormType {
  @Field()
  id: string

  @Field()
  name: string
}

// An account a team has connected at an OAuth2 provider
@ObjectType()
export class IntegrationConnectionType {
  @Field()
  id: string

  @Field()
  provider: string

  @Field()
  providerName: string

  @Field({ nullable: true })
  accountEmail?: string

  @Field({ nullable: true })
  accountName?: string

  // Name of the member who connected it
  @Field({ nullable: true })
  connectedBy?: string

  // IntegrationConnectionStatusEnum: 1 active, 2 needs reconnecting
  @Field(type => Number)
  status: number

  @Field({ nullable: true })
  statusReason?: string

  // For one app: whether the account has granted the app's scopes
  @Field({ nullable: true })
  hasScopes?: boolean

  // Forms with an integration that uses it
  @Field(type => [IntegrationConnectionFormType], { nullable: true })
  forms?: IntegrationConnectionFormType[]

  // The current user connected it, or owns the workspace
  @Field({ nullable: true })
  canDisconnect?: boolean
}

@InputType()
export class UpdateIntegrationStatusInput extends IntegrationInput {
  @Field(type => Number)
  @IsEnum(IntegrationStatusEnum)
  status: IntegrationStatusEnum
}

@ObjectType()
export class IntegrationRecordType {
  @Field()
  id: string

  @Field()
  submissionId: string

  // IntegrationRecordStatusEnum: 0 waiting for reconnection, 1 succeeded, 2 failed
  @Field(type => Number)
  status: number

  @Field()
  attempt: number

  @Field()
  maxAttempts: number

  @Field()
  willRetry: boolean

  @Field({ nullable: true })
  error?: string

  // Unix seconds
  @Field()
  createdAt: number
}
