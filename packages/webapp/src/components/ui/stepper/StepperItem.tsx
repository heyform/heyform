import { helper } from '@heyform-inc/utils'
import { IconCircleCheckFilled } from '@tabler/icons-react'
import clsx from 'clsx'
import { FC, ReactNode, useMemo } from 'react'

export interface StepperItemProps {
  value: string
  label: ReactNode
  index: number
  activeIndex: number
  rootClickable?: boolean
  clickable?: boolean
  disabled?: boolean
  isLast?: boolean
  onClick?: (value: string, index: number) => void
}

export const StepperItem: FC<StepperItemProps> = ({
  label,
  value,
  index,
  activeIndex,
  rootClickable,
  clickable: itemClickable,
  disabled,
  isLast,
  onClick
}) => {
  const isActive = useMemo(() => index === activeIndex, [index, activeIndex])
  const isCompleted = useMemo(() => index < activeIndex, [index, activeIndex])
  const isClickable = useMemo(
    () => (!helper.isNil(rootClickable) ? rootClickable : itemClickable),
    [rootClickable, itemClickable]
  )

  function handleClick() {
    if (!isClickable) {
      return
    }

    onClick?.(value, index)
  }

  return (
    <>
      <div
        className={clsx('stepper-item', {
          'stepper-item-active': isActive,
          'stepper-item-disabled': disabled,
          'stepper-item-completed': isCompleted,
          'stepper-item-clickable': isClickable
        })}
        onClick={handleClick}
      >
        <span className="stepper-icon-container">
          {isCompleted ? (
            <IconCircleCheckFilled className="stepper-icon" />
          ) : (
            <span className="stepper-index">{index + 1}</span>
          )}
        </span>
        <span className="stepper-label">{label}</span>
      </div>
      {!isLast && <div className="stepper-connector" />}
    </>
  )
}
