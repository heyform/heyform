import { IconX } from '@tabler/icons-react'
import clsx from 'clsx'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTransition } from 'react-transition-state'

import Button from '../button'
import Portal from '../portal'
import { IComponentProps } from '../typing'
import { KeyCode, stopPropagation } from '../utils'

export interface ModalProps extends IComponentProps {
  contentClassName?: string
  visible?: boolean
  maskClosable?: boolean
  showCloseIcon?: boolean
  confirmLoading?: boolean
  duration?: number
  unmountOnExit?: boolean
  onClose?: () => void
  onExited?: () => void
}

const Modal: FC<ModalProps> = ({
  className,
  contentClassName,
  visible,
  duration = 150,
  maskClosable = true,
  showCloseIcon = false,
  confirmLoading = false,
  unmountOnExit = true,
  style,
  children,
  onClose,
  onExited,
  ...restProps
}) => {
  const ref = useRef<HTMLDivElement>(null)

  function handleClose() {
    if (maskClosable && !confirmLoading) {
      onClose && onClose()
    }
  }

  function handleCloseButtonClick() {
    if (!confirmLoading) {
      onClose && onClose()
    }
  }

  function handleMaskClick(event: any) {
    stopPropagation(event)

    if (!ref.current || ref.current.contains(event.target as Node)) {
      return
    }

    handleClose()
  }

  function handleKeyDown(event: any) {
    if (event.keyCode === KeyCode.ESC) {
      stopPropagation(event)
      handleClose()
    }
  }

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
    unmountOnExit,
    onChange: handleStateChange
  })

  const handleCloseCallback = useCallback(handleClose, [])
  const handleCloseButtonClickCallback = useCallback(handleCloseButtonClick, [])
  const CloseIcon = useMemo(() => <IconX onClick={handleCloseCallback} />, [])

  const memoPopup = useMemo(
    () => (
      <div className={clsx('modal-root', `modal-transition-${state}`, className)} {...restProps}>
        <div
          className="modal-mask"
          style={{
            transitionDuration: `${duration}ms`
          }}
          onClick={handleCloseCallback}
        />
        <div
          className="modal-container"
          tabIndex={-1}
          role="dialog"
          onKeyDown={handleKeyDown}
          onClick={handleMaskClick}
        >
          <div
            ref={ref}
            className={clsx('modal-content', contentClassName)}
            style={{
              ...style,
              transitionDuration: `${duration}ms`
            }}
          >
            <div className="modal-body">
              {showCloseIcon && (
                <Button.Link
                  className="modal-close-button"
                  leading={CloseIcon}
                  onClick={handleCloseButtonClickCallback}
                />
              )}
              {children}
            </div>
          </div>
        </div>
      </div>
    ),
    [children, state]
  )

  const memoPortal = useMemo(() => <Portal visible={true}>{memoPopup}</Portal>, [memoPopup])

  useEffect(() => {
    toggle(visible)
  }, [visible])

  return <>{state !== 'unmounted' && state !== 'exited' && memoPortal}</>
}

export default Modal
