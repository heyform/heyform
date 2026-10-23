import { Field, ObjectType } from '@nestjs/graphql'
import GraphQLJSON from 'graphql-type-json'

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

  @Field(type => GraphQLJSON, { nullable: true })
  defaultValue?: unknown
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

  @Field(type => [AppSettingType], { nullable: true })
  settings?: AppSettingType[]
}
