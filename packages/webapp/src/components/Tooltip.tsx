import {
  Content,
  Portal,
  Provider,
  Root,
  TooltipContentProps,
  Trigger
} from '@radix-ui/react-tooltip'
import { FC, ReactNode } from 'react'

import { cn } from '@/utils'

interface TooltipProps extends ComponentProps {
  label?: ReactNode
  contentProps?: TooltipContentProps
}

export const Tooltip: FC<TooltipProps> = ({ label, contentProps, children }) => {
  return (
    <Provider>
      <Root delayDuration={100}>
        <Trigger asChild>{children}</Trigger>
        <Portal>
          <Content
            sideOffset={5}
            {...contentProps}
            className={cn(
              'z-10 overflow-hidden rounded-md bg-primary px-2.5 py-1.5 text-sm text-primary-light animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 sm:py-1 sm:text-xs',
              contentProps?.className
            )}
          >
            {label}
          </Content>
        </Portal>
      </Root>
    </Provider>
  )
}
