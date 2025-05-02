import type { FC } from 'react'

import { IComponentProps } from '@/components'

export const CollapseIcon: FC<IComponentProps<HTMLOrSVGElement>> = props => (
  <svg width="8" height="6" viewBox="0 0 8 6" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M4 6l4-6H0z" fillRule="evenodd" fill="currentColor"></path>
  </svg>
)
