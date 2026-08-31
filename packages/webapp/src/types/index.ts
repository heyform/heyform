import { FormField, FormModel, SubmissionModel } from '@heyform-inc/shared-types-enums'

export interface SubmissionType extends SubmissionModel {
  pseudonymId?: string
}

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
  content: string
  publishedAt: string
}

export * from './form'
export * from './user'
export * from './workspace'
