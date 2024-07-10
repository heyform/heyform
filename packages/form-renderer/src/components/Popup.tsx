import type { Options as PopperOptions } from '@popperjs/core/lib/types'
import clsx from 'clsx'
import type { FC, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePopper } from 'react-popper'
import { useTransition } from 'react-transition-state'

import { IComponentProps } from '../typings'
import { stopEvent } from '../utils'
import { TRANSITION_UNMOUNTED_STATES } from '../consts'

interface PortalProps {
  visible?: boolean
  container?: HTMLElement
  children: ReactNode
}

export interface PopupProps extends Omit<IComponentProps, 'children'> {
  visible?: boolean
  transitionName?: string
  duration?: number
  mask?: boolean
  maskClosable?: boolean
  referenceRef: Element
  popperOptions: Partial<PopperOptions>
  children: ReactNode
  onExited?: () => void
}

const Portal: FC<PortalProps> = ({ visible, container, children }) => {
  if (!visible || !children) {
    return null
  }

  return createPortal(children, container || document.body)
}

export const Popup: FC<PopupProps> = ({
  className,
  style,
  transitionName = 'popup-transition',
  duration = 100,
  visible = false,
  mask = true,
  maskClosable = true,
  referenceRef,
  popperOptions,
  children,
  onExited,
  ...restProps
}) => {
  const [popperRef, setPopperRef] = useState<HTMLDivElement | null>(null)
  const {
    attributes: { popper: attributes },
    styles: { popper: styles }
  } = usePopper(referenceRef, popperRef, popperOptions)

  const [transitionState, toggle] = useTransition({
    timeout: duration,
    initialEntered: visible,
    preEnter: true,
    preExit: true,
    unmountOnExit: true
  })

  function handleMaskClick(event: any) {
    stopEvent(event)

    if (maskClosable) {
      toggle(false)
    }
  }

  const handleMaskClickCallback = useCallback(handleMaskClick, [])

  useEffect(() => {
    if (transitionState.status === 'unmounted') {
      onExited?.()
    }
  }, [transitionState.status])

  useEffect(() => {
    toggle(visible)
  }, [visible])

  const memoPopup = useMemo(() => {
    let placement = popperOptions.placement as string

    if (attributes) {
      placement = attributes['data-popper-placement']
    }

    return (
      <div className={clsx('popup', `${transitionName}-${transitionState.status}`, className)} {...restProps}>
        {mask && <div className="popup-mask" onClick={handleMaskClickCallback} />}
        <div
          ref={setPopperRef}
          className={clsx('popup-content', `popup-placement-${placement}`)}
          style={{
            ...style,
            ...styles,
            transitionDuration: `${duration}ms`
          }}
        >
          {children}
        </div>
      </div>
    )
  }, [children, transitionState.status, styles, attributes])
  const memoPortal = useMemo(() => <Portal visible={true}>{memoPopup}</Portal>, [memoPopup])

  return <>{!TRANSITION_UNMOUNTED_STATES.includes(transitionState.status) && memoPortal}</>
}
