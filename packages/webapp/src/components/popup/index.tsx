import type { Options as PopperOptions } from '@popperjs/core/lib/types'
import clsx from 'clsx'
import type { FC, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePopper } from 'react-popper'
import { useTransition } from 'react-transition-state'

import { Portal } from '../Portal'
import { stopEvent } from '../utils'

type IComponentProps = /*unresolved*/ any

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

const Popup: FC<PopupProps> = ({
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

  function handleStateChange({ state }: any) {
    if (state === 'unmounted') {
      onExited?.()
    }
  }

  const [state, toggle] = useTransition({
    timeout: duration,
    initialEntered: visible,
    preEnter: true,
    preExit: true,
    unmountOnExit: true,
    onStateChange: handleStateChange
  })

  function handleMaskClick(event: any) {
    stopEvent(event)

    if (maskClosable) {
      toggle(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleMaskClickCallback = useCallback(handleMaskClick, [])

  useEffect(() => {
    toggle(visible)
  }, [visible])

  const memoPopup = useMemo(() => {
    let placement = popperOptions.placement as string

    if (attributes) {
      placement = attributes['data-popper-placement']
    }

    return (
      <div className={clsx('popup', `${transitionName}-${state}`, className)} {...restProps}>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, state, styles, attributes])
  const memoPortal = useMemo(() => <Portal visible={true}>{memoPopup}</Portal>, [memoPopup])

  return <>{state.status !== 'unmounted' && state.status !== 'exited' && memoPortal}</>
}

export default Popup
