import clsx from 'clsx'
import { FC, useMemo } from 'react'

import { IComponentProps } from '../typing'

export interface ProgressProps extends IComponentProps {
  type?: 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink'
  barClassName?: string
  percent: number
}

const Progress: FC<ProgressProps> = ({
  className,
  barClassName,
  type = 'blue',
  percent,
  ...restProps
}) => {
  const width = useMemo(() => {
    return Math.max(0, Math.min(percent, 100)) + '%'
  }, [percent])

  return (
    <div
      className={clsx(
        'progress',
        {
          [`progress-${type}`]: type
        },
        className
      )}
      {...restProps}
    >
      <div className={clsx('progress-bar', barClassName)} style={{ width }} />
    </div>
  )
}

export default Progress
