import clsx from 'clsx'
import type { FC } from 'react'
import { useEffect, useMemo, useReducer } from 'react'

import { IComponentProps } from '../typing'
import { KeyCode, preventDefault } from '../utils'
import { MenusStoreContext, MenusStoreReducer } from './context'

export interface MenusProps extends Omit<IComponentProps<HTMLDivElement>, 'onClick' | 'onSelect'> {
  keyboardInteraction?: boolean
  onExited?: () => void
  onClick?: (value?: any) => void
}

const PREVENT_KEYCODES = [KeyCode.UP, KeyCode.DOWN, KeyCode.ESC, KeyCode.ENTER]

const Menus: FC<MenusProps> = ({
  className,
  children,
  keyboardInteraction = true,
  onClick,
  onExited,
  ...restProps
}) => {
  const [state, dispatch] = useReducer(MenusStoreReducer, {
    values: [],
    onClick
  })
  const storeValue = useMemo(() => ({ state, dispatch }), [state])

  function highlight(keyCode: number) {
    let index = state.values.findIndex(value => value === state.highlighted)

    if (keyCode === KeyCode.UP) {
      index = index === -1 ? -1 : index - 1
    } else {
      index = index >= state.values.length - 1 ? 0 : index + 1
    }

    dispatch({
      type: 'highlight',
      payload: {
        index
      }
    })
  }

  function handleKeyDown(event: KeyboardEvent) {
    const { keyCode } = event

    switch (keyCode) {
      case KeyCode.ESC:
        onExited?.()
        break

      case KeyCode.UP:
      case KeyCode.DOWN:
        highlight(keyCode)
        break

      case KeyCode.ENTER:
        onClick?.(state.highlighted)
        onExited?.()
        break
    }

    if (PREVENT_KEYCODES.includes(keyCode)) {
      preventDefault(event)
    }
  }

  useEffect(() => {
    if (keyboardInteraction) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      if (keyboardInteraction) {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [keyboardInteraction, state])

  return (
    <MenusStoreContext.Provider value={storeValue}>
      <div className={clsx('menus', className)} role="menu" tabIndex={-1} {...restProps}>
        {children}
      </div>
    </MenusStoreContext.Provider>
  )
}

export default Menus
