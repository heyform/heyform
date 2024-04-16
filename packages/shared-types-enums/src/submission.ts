import type { ContactModel } from './audience'
import type { FieldKindEnum } from './enums/form'
import type {
  SubmissionCategoryEnum,
  SubmissionStatusEnum
} from './enums/submission'
import type { HiddenField, Property, Variable } from './form'

export interface SharedColumns {
  id: string
  kind: FieldKindEnum
  properties?: Property
  value: any
}

export interface Answer extends SharedColumns {
  title: string
  description?: string
}

export interface HiddenFieldAnswer extends HiddenField {
  value: string
}

export interface SubmissionModel {
  id: string
  formId: string
  category: SubmissionCategoryEnum
  title: string
  contact?: ContactModel
  answers: Answer[]
  hiddenFields: HiddenFieldAnswer[]
  columns?: SharedColumns[]
  variables?: Variable[]
  startAt?: number
  endAt?: number
  status: SubmissionStatusEnum
}
