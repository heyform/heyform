import clsx from 'clsx'
import type { FC, ReactNode } from 'react'
import { useState } from 'react'

import { useKey } from '@/utils'

import { IComponentProps } from '../typing'

export interface RateProps extends Omit<IComponentProps, 'onChange'> {
  itemRender: (index: number) => ReactNode
  count?: number
  value?: number
  onChange?: (value: number) => void
}

interface RateItemProps extends Omit<RateProps, 'onChange' | 'onClick' | 'onMouseOver' | 'count'> {
  index: number
  hoverValue?: number
  onClick: (index: number) => void
  onMouseOver: (index: number) => void
}

const RateItem: FC<RateItemProps> = ({
  className,
  itemRender,
  index,
  value = 0,
  hoverValue = 0,
  onClick,
  onMouseOver,
  ...restProps
}) => {
  function handleClick() {
    onClick(index)
  }

  function handleMouseOver() {
    onMouseOver(index)
  }

  useKey(String(index), handleClick)

  return (
    <div
      key={index}
      className={clsx(
        'rate-item',
        {
          'rate-item-hover': hoverValue >= index,
          'rate-item-active': value >= index
        },
        className
      )}
      onClick={handleClick}
      onMouseOver={handleMouseOver}
      {...restProps}
    >
      {itemRender(index)}
    </div>
  )
}

const Rate: FC<RateProps> = ({
  className,
  itemRender,
  value = 0,
  count = 5,
  onChange,
  ...restProps
}) => {
  const [hoverValue, setHoverValue] = useState(0)

  function handleClick(index: number) {
    onChange?.(index)
  }

  function handleMouseLeave() {
    setHoverValue(0)
  }

  return (
    <div className={clsx('rate', className)} onMouseLeave={handleMouseLeave} {...restProps}>
      {Array.from({ length: count }).map((_, index) => (
        <RateItem
          key={index}
          index={index + 1}
          value={value}
          hoverValue={hoverValue}
          onClick={handleClick}
          onMouseOver={setHoverValue}
          itemRender={itemRender}
        />
      ))}
    </div>
  )
}

export default Rate
