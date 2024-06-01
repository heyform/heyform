import { FieldKindEnum, FormField, FormModel } from '@heyform-inc/shared-types-enums'
import type { HTMLAttributes } from 'react'

export interface IFormField extends FormField {
  parent?: IFormField
  isTouched?: boolean
}

export interface IFormModel extends FormModel {
  fields: IFormField[]
}

export interface IPartialFormField {
  id: string
  index: number
  title?: string | any[]
  kind: FieldKindEnum
  required?: boolean
  children?: IPartialFormField[]
}

export type AnyMap<T = any> = Record<string, T>
export type IComponentProps<E = HTMLElement> = HTMLAttributes<E>
