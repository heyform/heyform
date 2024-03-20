import clsx from 'clsx'
import { FC, useContext, useEffect, useMemo } from 'react'

import { IComponentProps } from '../typing'
import { TabsStoreContext } from './context'

export interface TabsPaneProps extends Omit<IComponentProps, 'title'> {
  name: any
  title: string
  lazy?: boolean
  disabled?: boolean
}

const TabsPane: FC<TabsPaneProps> = ({
  name,
  title,
  lazy = false,
  disabled,
  children,
  className,
  ...restProps
}) => {
  const { state, dispatch } = useContext(TabsStoreContext)

  useEffect(() => {
    dispatch({
      type: 'register',
      payload: {
        name,
        title,
        disabled
      }
    })

    return () => {
      dispatch({
        type: 'unregister',
        payload: name
      })
    }
  }, [])

  const memoElement = useMemo(
    () => (
      <div
        className={clsx(
          'tabs-pane',
          {
            'tabs-pane-active': state.activeName === name
          },
          className
        )}
        {...restProps}
      >
        {children}
      </div>
    ),
    [state.activeName, name]
  )

  if (lazy && state.activeName !== name) {
    return null
  }

  return memoElement
}

export default TabsPane
