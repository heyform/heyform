import {
  Placement,
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
  useRole
} from '@floating-ui/react'
import clsx from 'clsx'
import { FC, ReactNode, cloneElement, useMemo, useState } from 'react'

import { IComponentProps } from '../typing'
import { mergeRefs } from '../utils'

export interface TooltipProps extends IComponentProps {
  visible?: boolean
  disabled?: boolean
  placement?: Placement
  ariaLabel: ReactNode
}

const Tooltip: FC<TooltipProps> = ({
  className,
  placement = 'top',
  ariaLabel,
  children,
  style,
  ...restProps
}) => {
  const [open, setOpen] = useState(false)

  const { x, y, reference, floating, strategy, context } = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    middleware: [offset(5), flip(), shift()],
    whileElementsMounted: autoUpdate
  })

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context),
    useRole(context, { role: 'tooltip' }),
    useDismiss(context)
  ])

  const ref = useMemo(() => mergeRefs([reference, (children as any).ref]), [reference, children])

  return (
    <>
      {cloneElement(
        children as any,
        getReferenceProps({
          ref,
          ...(children as any).props
        })
      )}

      {open && (
        <div
          ref={floating}
          className={clsx('tooltip', className)}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            ...style
          }}
          {...restProps}
          {...getFloatingProps()}
        >
          {ariaLabel}
        </div>
      )}
    </>
  )
}

export default Tooltip
