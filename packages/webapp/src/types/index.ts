import {
  FormField,
  FormModel,
  Logic,
  SubmissionModel,
  ThemeSettings
} from '@heyform-inc/shared-types-enums'

export interface SubmissionType extends SubmissionModel {
  pseudonymId?: string
}

// Extend the published shared types until the next shared package release.
export interface FormThemeSettings extends ThemeSettings {
  favicon?: string | null
}

export interface FormType extends Omit<FormModel, 'fields'> {
  themeSettings?: FormThemeSettings
  drafts?: FormField[]
  draftLogics?: Logic[]
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
  id: number
  version: string
  changelog: string
  url: string
  publishedAt: string
}

export * from './form'
export * from './user'
export * from './workspace'
