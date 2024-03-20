import clsx from 'clsx'
import { FC, useMemo } from 'react'

import { IComponentProps } from '../typing'
import { StepperItem, StepperItemProps } from './StepperItem'

export interface StepperProps extends Omit<IComponentProps, 'onChange'> {
  items: Pick<StepperItemProps, 'value' | 'label' | 'clickable' | 'disabled'>[]
  clickable?: boolean
  value?: string | null
  onChange?: (value: string, index: number) => void
}

const Stepper: FC<StepperProps> = ({
  className,
  items: rawItems = [],
  clickable,
  value,
  onChange,
  ...restProps
}) => {
  const items = useMemo(
    () =>
      rawItems.map((row, index) => ({
        ...row,
        index,
        isLast: index === rawItems.length - 1
      })),
    [rawItems]
  )
  const activeIndex = useMemo(() => {
    const n = items.findIndex(row => row.value === value)
    return n > -1 ? n : 0
  }, [items, value])

  return (
    <div className={clsx('stepper', className)} {...restProps}>
      {items.map((item, index) => (
        <StepperItem
          key={item.value}
          {...item}
          index={index}
          activeIndex={activeIndex}
          rootClickable={clickable}
          onClick={onChange}
        />
      ))}
    </div>
  )
}

export default Stepper
