import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import type { ReactNode } from 'react'

export interface FieldItemProps {
  kind: FieldKindEnum
  icon: ReactNode
  label: string
  description: string
}

export interface ComponentsOptions {
  name: string
  children: FieldItemProps[]
}

export enum ComposeTabKeyEnum {
  COMPONENT = 'component',
  THEME = 'theme',
  CUSTOMIZE = 'customize'
}
