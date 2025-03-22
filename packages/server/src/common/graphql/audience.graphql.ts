import { Field, InputType, ObjectType } from '@nestjs/graphql'
import {
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  Max,
  Min
} from 'class-validator'

@InputType()
class BaseContactInput {
  @Field()
  fullName: string

  @Field()
  @IsEmail()
  email: string

  @Field({ nullable: true })
  @IsOptional()
  jobTitle?: string

  @Field({ nullable: true })
  @IsOptional()
  phoneNumber?: string

  @Field({ nullable: true })
  @IsOptional()
  note?: string
}

@InputType()
export class CreateContactInput extends BaseContactInput {
  @Field()
  teamId: string

  @Field(type => [String])
  @IsArray()
  groupIds: string[]
}

@InputType()
export class ContactsInput {
  @Field()
  teamId: string

  @Field(type => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  groupIds?: string[]

  @Field({ nullable: true })
  @IsOptional()
  keyword?: string

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
export class UpdateContactInput {
  @Field()
  teamId: string

  @Field()
  contactId: string

  @Field({ nullable: true })
  @IsOptional()
  fullName?: string

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string

  @Field({ nullable: true })
  @IsOptional()
  phoneNumber?: string

  @Field({ nullable: true })
  @IsOptional()
  jobTitle?: string

  @Field({ nullable: true })
  @IsOptional()
  note?: string

  @Field(type => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  groupIds?: string[]
}

@InputType()
export class AddContactsToGroupInput {
  @Field()
  teamId: string

  @Field(type => [String])
  @IsArray()
  contactIds: string[]

  @Field()
  groupId: string
}

@InputType()
export class ImportContactsInput {
  @Field()
  teamId: string

  @Field(type => [BaseContactInput])
  @IsArray()
  contacts: BaseContactInput[]

  @Field(type => [String])
  @IsArray()
  groupIds: string[]
}

@InputType()
export class DeleteContactsInput {
  @Field()
  teamId: string

  @Field(type => [String])
  @IsArray()
  contactIds: string[]
}

@InputType()
export class CreateGroupInput {
  @Field()
  teamId: string

  @Field()
  name: string
}

@InputType()
export class GroupsInput {
  @Field()
  teamId: string

  @Field({ nullable: true })
  @IsOptional()
  keyword?: string

  @Field({ nullable: true, defaultValue: 1 })
  @IsOptional()
  @Min(1)
  page?: number

  @Field({ nullable: true, defaultValue: 30 })
  @IsOptional()
  @Max(30)
  @Min(0)
  limit?: number
}

@InputType()
export class UpdateGroupInput {
  @Field()
  teamId: string

  @Field()
  groupId: string

  @Field()
  name: string
}

@InputType()
export class DeleteGroupInput {
  @Field()
  teamId: string

  @Field()
  groupId: string
}

@InputType()
export class ShareToAudienceInput {
  @Field()
  formId: string

  @Field(type => [String])
  @IsArray()
  groupIds: string[]
}

@ObjectType()
export class GroupType {
  @Field()
  id: string

  @Field({ nullable: true })
  teamId?: string

  @Field()
  name: string

  @Field({ nullable: true })
  contactCount?: number
}

@ObjectType()
export class GroupsResultType {
  @Field()
  total: number

  @Field(type => [GroupType])
  groups: GroupType[]
}

@ObjectType()
export class ContactType {
  @Field()
  id: string

  @Field()
  teamId: string

  @Field()
  fullName: string

  @Field()
  email: string

  @Field({ nullable: true })
  jobTitle?: string

  @Field({ nullable: true })
  avatar?: string

  @Field({ nullable: true })
  phoneNumber?: string

  @Field({ nullable: true })
  note?: string

  @Field(type => [GroupType], { nullable: true })
  groups?: GroupType[]
}

@ObjectType()
export class ContactsResultType {
  @Field()
  total: number

  @Field(type => [ContactType])
  contacts: ContactType[]
}
