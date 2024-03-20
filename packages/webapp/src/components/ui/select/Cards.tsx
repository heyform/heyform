import clsx from 'clsx'
import { FC, useEffect, useMemo, useReducer } from 'react'

import { IComponentProps } from '../typing'
import { SelectCardsContext, SelectCardsReducer } from './CardsContext'

export interface SelectCardsProps extends Omit<IComponentProps, 'onChange'> {
  value?: string
  onChange?: (value: string) => void
}

const SelectCards: FC<SelectCardsProps> = ({
  className,
  value,
  children,
  onChange,
  ...restProps
}) => {
  const [state, dispatch] = useReducer(SelectCardsReducer, {
    names: [],
    activeName: value,
    onChange
  })
  const storeValue = useMemo(() => ({ state, dispatch }), [state])

  useEffect(() => {
    dispatch({
      type: 'setActive',
      payload: value
    })
  }, [value])

  return (
    <SelectCardsContext.Provider value={storeValue}>
      <div className={clsx('select-cards', className)} {...restProps}>
        {children}
      </div>
    </SelectCardsContext.Provider>
  )
}

export default SelectCards
