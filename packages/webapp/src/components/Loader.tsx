import { FC, HTMLAttributes, SVGAttributes } from 'react'

import Icon from '@/assets/loader.svg?react'
import { cn } from '@/utils'

type ComponentProps<E = HTMLElement> = HTMLAttributes<E>

const LoaderComponent: FC<Omit<ComponentProps<SVGSVGElement>, 'children'>> = ({
  className,
  ...restProps
}) => {
  return <Icon className={cn('h-5 w-5 animate-spin', className)} {...restProps} />
}

const ThreeDot: FC<SVGAttributes<SVGElement>> = props => {
  return (
    <svg width="22" height="5" viewBox="0 0 21 5" fill="none" {...props}>
      <rect className="loader-span" width="5" height="5" rx="2.5" fill="currentColor" />
      <rect className="loader-span" x="8" width="5" height="5" rx="2.5" fill="currentColor" />
      <rect className="loader-span" x="16" width="5" height="5" rx="2.5" fill="currentColor" />
    </svg>
  )
}

export const Loader = Object.assign(LoaderComponent, {
  ThreeDot
})
