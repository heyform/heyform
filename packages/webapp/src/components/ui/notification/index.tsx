import { nanoid } from '@heyform-inc/utils'
import { IconCircleCheck, IconCircleX, IconExclamationCircle, IconX } from '@tabler/icons-react'
import clsx from 'clsx'
import type { FC, ReactNode, RefObject } from 'react'
import {
  createRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState
} from 'react'
import { createRoot } from 'react-dom/client'
import { useTransition } from 'react-transition-state'

import Button from '../button'
import Spin from '../spin'

export interface NotificationOptions {
  id?: string
  icon?: ReactNode
  title?: string
  message?: string
  duration?: number
}

export interface NotificationProps extends NotificationOptions {
  onExited?: (id: string) => void
}

export interface NotificationListProps {
  add: (options: NotificationOptions) => void
  delete: (id: string) => void
}

const Notification: FC<NotificationProps> = ({
  id,
  icon,
  title,
  message,
  duration = 8000,
  onExited
}) => {
  function handleStateChange({ state }: any) {
    if (state === 'unmounted') {
      onExited?.(id!)
    }
  }

  const [state, toggle] = useTransition({
    timeout: 150,
    initialEntered: false,
    preEnter: true,
    preExit: true,
    unmountOnExit: true,
    onChange: handleStateChange
  })

  function handleClick() {
    toggle(false)
  }

  const CloseIcon = useMemo(() => <IconX />, [])
  const handleClickCallback = useCallback(handleClick, [])

  useEffect(() => {
    toggle(true)

    if (duration > 0) {
      const timer = setTimeout(handleClick, duration)

      return () => {
        if (timer) {
          handleClick()
          clearTimeout(timer)
        }
      }
    }
  }, [])

  return (
    <>
      {state !== 'unmounted' && state !== 'exited' && (
        <div className={clsx('notification', `notification-transition-${state}`)}>
          <div className="notification-wrapper">
            {icon && <div className="notification-icon">{icon}</div>}
            <div className="notification-body">
              <p className="notification-title">{title}</p>
              {message && <p className="notification-message">{message}</p>}
            </div>
            <div className="notification-close">
              <Button.Link leading={CloseIcon} onClick={handleClickCallback} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const NotificationList = forwardRef<NotificationListProps>((_, ref) => {
  const [options, setOptions] = useState<NotificationOptions[]>([])

  function handleExited(id: string) {
    setOptions(options.filter(row => row.id !== id))
  }

  const handleExitedCallback = useCallback(handleExited, [])

  useImperativeHandle(ref, () => {
    return {
      add(option: NotificationOptions) {
        const index = options.findIndex(
          row => row.title === option.title && row.message === option.message
        )
        if (index > -1) {
          options.splice(index, 1)
        }
        setOptions([option, ...options])
      },
      delete(id: string) {
        setOptions(options.filter(row => row.id !== id))
      }
    }
  })

  return (
    <div className="notification-list">
      {options.map(row => (
        <Notification key={row.id} onExited={handleExitedCallback} {...row} />
      ))}
    </div>
  )
})

let ref: RefObject<NotificationListProps>

function notification(options: NotificationOptions) {
  const id = nanoid(6)

  ref.current?.add({
    id,
    ...options
  })

  return {
    dismiss() {
      ref.current?.delete(id)
    }
  }
}

notification.preload = () => {
  if ((!ref || !ref.current) && typeof document !== 'undefined') {
    const container = document.createElement('div')
    const root = createRoot(container)

    container.className = 'notification-root'
    document.body.appendChild(container)

    ref = createRef<NotificationListProps>()
    root.render(<NotificationList ref={ref} />)
  }
}

notification.success = (options: NotificationOptions) => {
  return notification({
    ...options,
    icon: <IconCircleCheck className="notification-success-icon" />
  })
}

notification.warning = (options: NotificationOptions) => {
  return notification({
    ...options,
    icon: <IconExclamationCircle className="notification-warning-icon" />
  })
}

notification.error = (options: NotificationOptions) => {
  return notification({
    ...options,
    icon: <IconCircleX className="notification-error-icon" />
  })
}

notification.loading = (options: NotificationOptions) => {
  return notification({
    ...options,
    icon: <Spin className="notification-loading-icon" />,
    duration: 0
  })
}

// Preload notification list to optimize performance
notification.preload()

export default notification
