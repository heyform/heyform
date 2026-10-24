import { FormField, FormModel, Property } from '@heyform-inc/shared-types-enums'

import { APP_STATUS_ENUM } from '@/consts'

export interface AppSettingOptionType {
  label: string
  value: string
}

export interface AppSettingType {
  type: 'text' | 'url' | 'textarea' | 'select' | 'switch'
  name: string
  label: string
  description?: string
  placeholder?: string
  required: boolean
  options?: AppSettingOptionType[]
  // select: options come from IntegrationService.settingOptions
  loadsOptions?: boolean
  // Settings whose values the loaded options depend on
  dependsOn?: string[]
  // Shown only while each named setting has the given value
  visibleWhen?: Record<string, string | boolean>
  defaultValue?: string | boolean
}

export interface AppAuthType {
  type: 'none' | 'apiKey' | 'oauth2'
  provider?: string
  providerName?: string
  label?: string
  description?: string
}

export interface AppType {
  id: string
  name: string
  description?: string
  icon?: string
  auth?: AppAuthType
  settings?: AppSettingType[]
  status?: APP_STATUS_ENUM
}

export interface IntegratedAppType extends AppType {
  integration: IntegrationType
  isAuthorized?: boolean
}

export interface IntegrationType {
  appId: string
  config?: AnyMap
  status: number
  // An OAuth2 account is connected
  connected?: boolean
  // The team's connected account it uses
  connectionId?: string
  // Masked end of the saved API key
  apiKeyHint?: string
  // Submissions waiting for the integration to be reconnected
  waitingCount?: number
}

// An account the team has connected at an OAuth2 provider
export interface IntegrationConnectionType {
  id: string
  provider: string
  providerName: string
  accountEmail?: string
  accountName?: string
  // Name of the member who connected it
  connectedBy?: string
  status: number
  statusReason?: string
  // For one app: whether the account has granted what it needs
  hasScopes?: boolean
  // Forms whose integrations use it
  forms?: { id: string; name: string }[]
  canDisconnect?: boolean
}

// One delivery attempt of a submission to an integration
export interface IntegrationRecordType {
  id: string
  submissionId: string
  status: number
  attempt: number
  maxAttempts: number
  willRetry: boolean
  error?: string
  // Unix seconds
  createdAt: number
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
