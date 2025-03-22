import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { IsString, IsUrl } from 'class-validator'

@InputType()
export class AppDetailInput {
  @Field()
  @IsString()
  clientId: string

  @Field()
  @IsUrl()
  redirectUri: string
}

@InputType()
export class AppAuthorizeUrlInput extends AppDetailInput {
  @Field()
  @IsString()
  responseType: string

  @Field({ nullable: true })
  state?: string

  @Field({ nullable: true })
  scope?: string
}

@ObjectType()
export class AppType {
  @Field({ nullable: true })
  id: string

  @Field({ nullable: true })
  internalType: number

  @Field({ nullable: true })
  uniqueId: string

  @Field()
  name: string

  @Field()
  category: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  avatar?: string

  @Field({ nullable: true })
  homepage?: string

  @Field({ nullable: true })
  helpLinkUrl?: string

  @Field({ nullable: true })
  planGrade?: number

  @Field({ nullable: true })
  status?: number
}
