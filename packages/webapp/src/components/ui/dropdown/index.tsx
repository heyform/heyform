import type { Placement as PopperPlacement } from '@popperjs/core'
import clsx from 'clsx'
import type { MouseEvent, ReactElement, ReactNode } from 'react'
import {
  cloneElement,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState
} from 'react'

import Popup from '../popup'
import { IComponentProps } from '../typing'
import { stopEvent } from '../utils'

export interface DropdownProps extends IComponentProps {
  popupClassName?: string
  visible?: boolean
  placement?: PopperPlacement
  disabled?: boolean
  dismissOnClickInside?: boolean
  duration?: number
  offset?: number[]
  overlay: ReactNode
  onDropdownVisibleChange?: (visible: boolean) => void
}

export interface DropdownInstance {
  open: () => void
  close: () => void
  toggle: () => void
}

const Dropdown = forwardRef<DropdownInstance, DropdownProps>(
  (
    {
      className,
      popupClassName,
      visible = false,
      placement = 'bottom-end',
      disabled,
      duration = 150,
      dismissOnClickInside = true,
      offset = [0, 0],
      overlay,
      children,
      onDropdownVisibleChange,
      ...restProps
    },
    dropdownRef
  ) => {
    const [ref, setRef] = useState<HTMLDivElement | null>(null)
    const [isOpen, setIsOpen] = useState(visible)

    function handleExited() {
      setIsOpen(false)
    }

    function handleClick(event: MouseEvent<HTMLDivElement>) {
      stopEvent(event)

      if (!disabled) {
        setIsOpen(true)
      }
    }

    function handleDropdownClick(event: MouseEvent<HTMLDivElement>) {
      stopEvent(event)

      if (dismissOnClickInside) {
        setIsOpen(false)
      }
    }

    const handleExitedCallback = useCallback(handleExited, [])

    useImperativeHandle(dropdownRef, () => {
      return {
        open() {
          setIsOpen(true)
        },

        close() {
          setIsOpen(false)
        },

        toggle() {
          setIsOpen(v => !v)
        }
      }
    })

    // Trigger dropdown open or not outside
    useEffect(() => {
      setIsOpen(visible)
    }, [visible])

    // Visible change callback
    useEffect(() => {
      onDropdownVisibleChange?.(isOpen)
    }, [isOpen])

    const memoOverlay = (
      <div className="dropdown-body" onClick={handleDropdownClick}>
        {cloneElement(overlay as ReactElement, {
          ...(overlay as ReactElement).props,
          onExited: handleExitedCallback
        })}
      </div>
    )

    return (
      <>
        <div
          ref={setRef}
          className={clsx('dropdown', className)}
          onClick={handleClick}
          {...restProps}
        >
          {children}
        </div>

        <Popup
          visible={isOpen}
          className={popupClassName}
          referenceRef={ref as Element}
          popperOptions={{
            placement,
            strategy: 'fixed',
            modifiers: [
              {
                name: 'computeStyles',
                options: {
                  gpuAcceleration: false
                }
              },
              {
                name: 'offset',
                options: {
                  offset
                }
              }
            ]
          }}
          duration={duration}
          onExited={handleExited}
        >
          {memoOverlay}
        </Popup>
      </>
    )
  }
)

export default Dropdown
