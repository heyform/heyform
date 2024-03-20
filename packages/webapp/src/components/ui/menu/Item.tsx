import { helper } from '@heyform-inc/utils'
import { IconCheck } from '@tabler/icons-react'
import clsx from 'clsx'
import type { FC, MouseEvent, ReactNode } from 'react'
import { useContext, useEffect } from 'react'

import { IComponentProps } from '../typing'
import { MenusStoreContext } from './context'

export interface MenuItemProps extends Omit<IComponentProps, 'onClick'> {
  icon?: ReactNode
  label: ReactNode
  value?: any
  role?: string
  disabled?: boolean
  isChecked?: boolean
  onClick?: (value?: any, event?: MouseEvent<HTMLDivElement>) => void
}

const MenuItem: FC<MenuItemProps> = ({
  className,
  icon,
  value,
  label,
  role = 'menuitem',
  disabled = false,
  isChecked,
  onClick,
  ...restProps
}) => {
  const { state, dispatch } = useContext(MenusStoreContext)

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (!disabled) {
      onClick?.(value, event)
      state.onClick?.(value)
    }
  }

  useEffect(() => {
    if (helper.isValid(value) && !disabled) {
      dispatch({
        type: 'register',
        payload: {
          value: value!
        }
      })
    }

    return () => {
      if (helper.isValid(value) && !disabled) {
        dispatch({
          type: 'unregister',
          payload: {
            value: value!
          }
        })
      }
    }
  }, [])

  return (
    <div
      className={clsx(
        'menu-item',
        {
          'menu-item-highlighted':
            !disabled && helper.isValid(value) && state.highlighted === value,
          'menu-item-disabled': disabled
        },
        className
      )}
      role={role}
      tabIndex={-1}
      onClick={handleClick}
      {...restProps}
    >
      <div className="menu-item-content">
        {icon}
        <div className="menu-item-label">{label}</div>
      </div>
      {isChecked && <IconCheck className="menu-item-checkmark" />}
    </div>
  )
}

export default MenuItem
