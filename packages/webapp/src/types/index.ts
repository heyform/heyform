import { FormField, FormModel } from '@heyform-inc/shared-types-enums'

export type { SubmissionModel as SubmissionType } from '@heyform-inc/shared-types-enums'

export interface FormType extends Omit<FormModel, 'fields'> {
  drafts?: FormField[]
  version: number
  fieldsUpdatedAt: number
  isDraft: boolean
  canPublish: boolean
  customReport: {
    id: string
    hiddenFields: string[]
    theme: AnyMap
    enablePublicAccess: boolean
  }
}

export interface ChangelogType {
  id: string
  title: string
  html: string
  publishedAt: string
}

export * from './form'
export * from './plan'
export * from './user'
export * from './workspace'
