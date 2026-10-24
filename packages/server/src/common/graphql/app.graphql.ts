import { Field, ObjectType } from '@nestjs/graphql'
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json'

@ObjectType()
export class AppSettingOptionType {
  @Field()
  label: string

  @Field()
  value: string
}

@ObjectType()
export class AppSettingType {
  @Field()
  type: string

  @Field()
  name: string

  @Field()
  label: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  placeholder?: string

  @Field()
  required: boolean

  @Field(type => [AppSettingOptionType], { nullable: true })
  options?: AppSettingOptionType[]

  // select: the options are loaded with integrationSettingOptions
  @Field({ nullable: true })
  loadsOptions?: boolean

  // Settings whose values the loaded options depend on
  @Field(type => [String], { nullable: true })
  dependsOn?: string[]

  // Shown only while each named setting has the given value
  @Field(type => GraphQLJSONObject, { nullable: true })
  visibleWhen?: Record<string, string | boolean>

  @Field(type => GraphQLJSON, { nullable: true })
  defaultValue?: unknown
}

// What the settings UI needs to know about an app's auth. Never includes
// credentials.
@ObjectType()
export class AppAuthType {
  @Field()
  type: string

  // oauth2: provider id and display name, e.g. `example` / `Example`
  @Field({ nullable: true })
  provider?: string

  @Field({ nullable: true })
  providerName?: string

  // apiKey: label and help text of the key input
  @Field({ nullable: true })
  label?: string

  @Field({ nullable: true })
  description?: string
}

@ObjectType()
export class AppType {
  @Field({ nullable: true })
  id: string

  @Field()
  name: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  icon?: string

  @Field(type => AppAuthType, { nullable: true })
  auth?: AppAuthType

  @Field(type => [AppSettingType], { nullable: true })
  settings?: AppSettingType[]
}
