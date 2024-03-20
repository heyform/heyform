import type { FormField as IFormField } from '@heyform-inc/shared-types-enums'
import { Property } from '@heyform-inc/shared-types-enums'

export enum IntegrationStatusEnum {
  ACTIVE = 1,
  DISABLED
}

export interface FormIntegration {
  formId: string
  thirdPartyId: string
  subKind: string
  uniqueName: string
  attributes?: Record<string, any>
  status: IntegrationStatusEnum
}

export interface FormAnalyticsSummary {
  totalVisits: number
  submissionCount: number
  completeRate: number
  averageDuration: string
}

export interface FormField extends IFormField {
  isCollapsed?: boolean
  parent?: IFormField
  properties?: Omit<Property, 'fields'> & {
    fields?: FormField[]
  }
}
