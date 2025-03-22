import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { IsArray, IsOptional } from 'class-validator'
import { TeamDetailInput } from './team.graphql'

@InputType()
export class CreateProjectInput extends TeamDetailInput {
  @Field()
  name: string

  @Field({ nullable: true })
  @IsOptional()
  avatar?: string

  @Field(type => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  memberIds?: string[]
}

@InputType()
export class ProjectDetailInput {
  @Field()
  projectId: string
}

@InputType()
export class DeleteProjectInput extends ProjectDetailInput {
  @Field()
  code: string
}

@InputType()
export class RenameProjectInput extends ProjectDetailInput {
  @Field()
  name: string
}

@InputType()
export class ProjectMemberInput {
  @Field()
  projectId: string

  @Field()
  memberId: string
}

@ObjectType()
export class ProjectMemberType {
  @Field()
  id: string

  @Field()
  name: string

  @Field()
  email: string

  @Field()
  avatar: string

  @Field()
  isOwner?: boolean
}

@ObjectType()
export class ProjectType {
  @Field()
  id: string

  @Field()
  teamId: string

  @Field()
  name: string

  @Field({ nullable: true })
  icon?: string

  @Field()
  ownerId: string

  @Field(type => [String], { nullable: true })
  members?: string[]

  @Field({ nullable: true })
  formCount?: number

  @Field({ nullable: true })
  isOwner?: boolean
}
