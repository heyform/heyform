import clsx from 'clsx'
import type { FC, MouseEvent, ReactNode } from 'react'
import { memo, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'

import Select from '../select'
import { IComponentProps } from '../typing'
import { stopPropagation } from '../utils'
import type { ITab } from './context'
import { TabsStoreContext, TabsStoreReducer } from './context'

export interface TabsProps extends Omit<IComponentProps, 'onChange'> {
  type?: 'navbar' | 'segment' | 'select'
  defaultActiveName?: any
  activeName?: any
  navRender?: (tab: ITab, isActive?: boolean) => ReactNode
  onChange?: (key: any) => void
}

export interface TabNavProps
  extends Omit<IComponentProps, 'onClick'>,
    Pick<TabsProps, 'navRender'> {
  tab: ITab
  isActive?: boolean
  onClick: (key: any) => void
}

const Nav: FC<TabNavProps> = ({ tab, isActive, navRender, onClick, ...restProps }) => {
  function handleClick(event: MouseEvent<HTMLDivElement>) {
    stopPropagation(event)
    onClick(tab.name)
  }

  return (
    <div
      className={clsx('tabs-nav', {
        'tabs-nav-active': isActive
      })}
      onClick={handleClick}
      {...restProps}
    >
      {navRender ? navRender(tab, isActive) : tab.title}
    </div>
  )
}

const ListComponent: FC<Pick<TabsProps, 'navRender'>> = ({ navRender }) => {
  const { state, dispatch } = useContext(TabsStoreContext)

  function handleClick(name: any) {
    dispatch({
      type: 'setActive',
      payload: name
    })
    state.onChange?.(name)
  }

  const handleClickCallback = useCallback(handleClick, [])

  if (state.type === 'select') {
    const options = state.tabs.map(t => ({
      label: t.title,
      value: t.name,
      disabled: t.disabled
    }))

    return (
      <Select
        className="tabs-nav-select"
        options={options}
        value={state.activeName}
        onChange={handleClick}
      />
    )
  }

  return (
    <div className="tabs-nav-list">
      {state.tabs.map(tab => (
        <Nav
          key={tab.name}
          tab={tab}
          isActive={tab.name === state.activeName}
          navRender={navRender}
          onClick={handleClickCallback}
        />
      ))}
    </div>
  )
}

const MemoList = memo(ListComponent)

const Tabs: FC<TabsProps> = ({
  className,
  type = 'navbar',
  defaultActiveName,
  activeName,
  children,
  navRender,
  onChange,
  ...restProps
}) => {
  const [state, dispatch] = useReducer(TabsStoreReducer, {
    type,
    tabs: [],
    activeName: activeName || defaultActiveName,
    onChange
  })
  const storeValue = useMemo(() => ({ state, dispatch }), [state])

  useEffect(() => {
    if (activeName) {
      dispatch({
        type: 'setActive',
        payload: activeName
      })
    }
  }, [activeName])

  return (
    <TabsStoreContext.Provider value={storeValue}>
      <div className={clsx('tabs-wrapper', className)} {...restProps}>
        <div className={`tabs-${type}`}>
          <MemoList navRender={navRender} />
        </div>
        <div className="tabs-pane-group">{children}</div>
      </div>
    </TabsStoreContext.Provider>
  )
}

export default Tabs
