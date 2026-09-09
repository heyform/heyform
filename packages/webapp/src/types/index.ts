import { FormField, FormModel, ThemeSettings } from '@heyform-inc/shared-types-enums'

export type { SubmissionModel as SubmissionType } from '@heyform-inc/shared-types-enums'

// Extend the published shared types until the next shared package release.
export interface FormThemeSettings extends ThemeSettings {
  favicon?: string | null
}

export interface FormType extends Omit<FormModel, 'fields'> {
  themeSettings?: FormThemeSettings
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
