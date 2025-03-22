import { FC } from 'react'

import { cn } from '@/utils'

export const Divider: FC<ComponentProps> = ({ className, children, ...restProps }) => {
  return (
    <div className={cn('relative', className)} {...restProps}>
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-input"></span>
      </div>
      <div className="relative flex justify-center text-xs uppercase" data-slot="content">
        <span className="bg-foreground px-2 text-secondary" data-slot="text">
          {children}
        </span>
      </div>
    </div>
  )
}
