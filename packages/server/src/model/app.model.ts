/**
 * Created by jiangwei on 2020/11/06.
 * Copyright (c) 2020 Heyooo, Inc. all rights reserved
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { PlanGradeEnum } from './plan.model'

export enum AppInternalTypeEnum {
  /**
   * 第三方需要 OAuth v2 授权登录的应用
   * 例如：Mailchimp, Google Drive
   */
  THIRD_PARTY_OAUTH = 1,
  /**
   * 第三方需要手工配置 api key 等设置的应用
   * 例如：Google Analytics
   */
  THIRD_PARTY_OPTIONS = 2,

  /**
   * HeyForm 开发的对外开放的需要 OAuth v2 授权登录的应用
   * 例如: https://zapier.com/apps/heyform/integrations
   */
  OPEN_APP_OAUTH = 3,
  // TBD
  OPEN_APP_OPTIONS = 4,

  // Team privatization application (TBD)
  TEAM_APP = 5
}

export enum AppStatusEnum {
  ACTIVE = 1,
  DISCARD,
  BANNED,
  PENDING = 4
}

@Schema()
export class AppModel extends Document {
  @Prop({ type: Number, required: true })
  internalType: AppInternalTypeEnum

  @Prop({
    type: String,
    required: true,
    unique: true
  })
  uniqueId: string

  @Prop({
    type: String,
    required: false
  })
  clientId: string

  @Prop({
    type: String,
    required: false
  })
  clientSecret: string

  @Prop({
    type: String,
    required: false
  })
  scope: string

  @Prop({
    type: String,
    required: false
  })
  userScope: string

  @Prop({
    type: String,
    required: false
  })
  redirectUri: string

  @Prop({
    type: String,
    required: true
  })
  category: string

  @Prop({
    type: String,
    required: true
  })
  name: string

  @Prop({
    type: String,
    required: false
  })
  description: string

  @Prop({
    type: String,
    required: false
  })
  avatar: string

  @Prop({
    type: String,
    required: false
  })
  homepage?: string

  @Prop()
  helpLinkUrl?: string

  @Prop({
    type: Map,
    required: true
  })
  config: Record<string, any>

  @Prop({
    type: Number,
    required: true,
    enum: Object.values(PlanGradeEnum)
  })
  planGrade: PlanGradeEnum

  @Prop({
    type: Number,
    required: true,
    enum: Object.values(AppStatusEnum)
  })
  status: AppStatusEnum
}

export const AppSchema = SchemaFactory.createForClass(AppModel)
