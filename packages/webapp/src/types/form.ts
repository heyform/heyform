import { FormField, FormModel, Property } from '@heyform-inc/shared-types-enums'

import { APP_STATUS_ENUM } from '@/consts'

export interface AppType {
  id: string
  internalType: number
  uniqueId: string
  category: string
  name: string
  description?: string
  avatar?: string
  homepage?: string
  helpLinkUrl?: string
  attributes?: AnyMap
  status: APP_STATUS_ENUM
}

export interface IntegratedAppType extends AppType {
  integration: IntegrationType
  isAuthorized?: boolean
}

export interface IntegrationType {
  appId: string
  attributes?: AnyMap
  status: number
}

export interface FormFieldType extends FormField {
  isCollapsed?: boolean
  parent?: FormFieldType
  properties?: Omit<Property, 'fields'> & {
    fields?: FormField[]
  }
}

export interface TemplateType extends FormModel {
  category: string
  recordId?: string
}

export interface TemplateGroupType {
  id: string
  category: string
  templates: TemplateType[]
}

export interface ChatMessageType {
  id: string
  type: 'text' | 'notification'
  content: string
  isUser?: boolean
}
