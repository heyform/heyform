import { Content, Root, Trigger } from '@radix-ui/react-tooltip'
import { FC, ReactNode } from 'react'

import { IComponentProps } from '../typings'

export interface TooltipProps extends IComponentProps {
  disabled?: boolean
  ariaLabel: ReactNode
}

export const Tooltip: FC<TooltipProps> = ({ ariaLabel, children, ...restProps }) => {
  return (
    <Root delayDuration={0}>
      <Trigger asChild {...restProps}>
        {children}
      </Trigger>
      <Content
        className="z-50 overflow-hidden rounded-md px-3 py-1.5 text-sm text-white bg-zinc-950 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        sideOffset={6}
      >
        {ariaLabel}
      </Content>
    </Root>
  )
}
