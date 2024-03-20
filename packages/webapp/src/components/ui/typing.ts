import type { HTMLAttributes, ReactNode } from 'react'

export type IComponentProps<E = HTMLElement> = HTMLAttributes<E>

export type IMapType<V = any> = Record<string | number | symbol, V>

export type IOptionType = IMapType<any> & {
  label: ReactNode
  value: any
  disabled?: boolean
}

export type IOptionGroupType = {
  group: ReactNode
  children: IOptionType[]
}
