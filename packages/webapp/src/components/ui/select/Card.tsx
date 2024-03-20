import { IconCheck } from '@tabler/icons-react'
import clsx from 'clsx'
import { FC, ReactNode, useContext, useEffect, useMemo } from 'react'

import { IComponentProps } from '../typing'
import { SelectCardsContext } from './CardsContext'

export interface SelectCardProps extends IComponentProps {
  name: string
  disabled?: boolean
  render?: (name: string, isActive: boolean) => ReactNode
}

const SelectCard: FC<SelectCardProps> = ({
  className,
  name,
  disabled,
  render,
  children,
  ...restProps
}) => {
  const { state, dispatch } = useContext(SelectCardsContext)
  const isActive = useMemo(() => state.activeName === name, [state.activeName, name])

  function handleClick() {
    if (!disabled) {
      state.onChange?.(name)
    }
  }

  useEffect(() => {
    dispatch({
      type: 'register',
      payload: name
    })

    return () => {
      dispatch({
        type: 'unregister',
        payload: name
      })
    }
  }, [])

  return (
    <div
      className={clsx(
        'select-card',
        {
          'select-card-disabled': disabled,
          'select-card-active': isActive
        },
        className
      )}
      onClick={handleClick}
      {...restProps}
    >
      {render ? (
        render(name, isActive)
      ) : (
        <div className="select-card-container">
          <div className="select-card-content">{children}</div>
          {isActive && (
            <div className="select-card-icon">
              <IconCheck />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SelectCard
