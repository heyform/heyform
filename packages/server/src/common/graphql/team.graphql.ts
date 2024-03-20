import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { ArrayMinSize, IsArray, IsEmail, IsEnum, IsOptional, IsUrl, Length } from 'class-validator'

import { ProjectType } from '@graphql'
import { ProjectModel, TeamRoleEnum } from '@model'

@InputType()
export class CreateTeamInput {
  @Field()
  @Length(1, 30, {
    message: 'Workspace name is limited to 30 characters'
  })
  name: string

  @Field({ nullable: true })
  @IsOptional()
  avatar?: string

  @Field(type => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  members?: string[]
}

@InputType()
export class TeamDetailInput {
  @Field()
  teamId: string
}

@InputType()
export class DissolveTeamInput extends TeamDetailInput {
  @Field()
  code: string
}

@InputType()
export class PublicTeamDetailInput extends TeamDetailInput {
  @Field()
  inviteCode: string
}

@InputType()
export class InviteMemberInput extends TeamDetailInput {
  @Field(type => [String])
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  emails: string[]
}

@InputType()
export class TeamCdnTokenInput {
  @Field()
  teamId: string

  @Field()
  mime: string

  @Field()
  filename: string
}

@InputType()
export class UpdateTeamInput extends TeamDetailInput {
  @Field({ nullable: true })
  @Length(1, 30, {
    message: 'Workspace name is limited to 30 characters'
  })
  @IsOptional()
  name?: string

  @Field({ nullable: true })
  @IsUrl()
  @IsOptional()
  avatar?: string
}

@InputType()
export class CreateInvitationInput extends TeamDetailInput {
  @Field(type => [String])
  emails: string[]
}

@InputType()
export class JoinTeamInput extends TeamDetailInput {
  @Field()
  inviteCode: string
}

@InputType()
export class DealWithInvitationInput {
  @Field()
  invitationId: string

  @Field()
  accept: boolean
}

@InputType()
export class TransferTeamInput extends TeamDetailInput {
  @Field()
  memberId: string
}

@InputType()
export class UpdateTeamMemberInput extends TransferTeamInput {
  @Field(type => Number)
  @IsEnum([TeamRoleEnum.ADMIN, TeamRoleEnum.COLLABORATOR, TeamRoleEnum.MEMBER])
  role: TeamRoleEnum
}

@ObjectType()
export class TeamIconType {
  @Field({ nullable: true })
  name?: string

  @Field()
  color: string

  @Field()
  background: string
}

@ObjectType()
export class PublicTeamOwnerType {
  @Field()
  name: string

  @Field({ nullable: true })
  avatar?: string
}

@ObjectType()
export class PublicTeamType {
  @Field()
  id: string

  @Field()
  name: string

  @Field({ nullable: true })
  avatar?: string

  @Field()
  allowJoinByInviteLink: boolean

  @Field({ nullable: true })
  memberCount?: number

  @Field({ nullable: true })
  additionalSeats?: number

  @Field(type => PublicTeamOwnerType, { nullable: true })
  owner?: PublicTeamOwnerType
}

@ObjectType()
export class TeamType extends PublicTeamType {
  @Field()
  ownerId: string

  @Field()
  inviteCode: string

  @Field({ nullable: true })
  inviteCodeExpireAt?: number

  @Field({ nullable: true })
  storageQuota?: number

  @Field({ nullable: true })
  submissionQuota?: number

  @Field({ nullable: true })
  isOwner?: boolean

  @Field(type => [ProjectType], { nullable: true })
  projects?: ProjectModel[]

  @Field(type => Number, { nullable: true })
  role?: TeamRoleEnum

  @Field({ nullable: true })
  trialEndAt?: number

  @Field()
  createdAt: Date
}

@ObjectType()
export class TeamSubscriptionType {
  @Field({ nullable: true })
  memberCount?: number

  @Field({ nullable: true })
  formCount?: number

  @Field({ nullable: true })
  submissionQuota?: number

  @Field({ nullable: true })
  storageQuota?: number
}

@ObjectType()
export class TeamMemberType {
  @Field()
  id: string

  @Field()
  name: string

  @Field()
  email: string

  @Field()
  avatar: string

  @Field()
  role: TeamRoleEnum

  @Field({ nullable: true })
  lastSeenAt?: number

  @Field()
  isOwner?: boolean
}
