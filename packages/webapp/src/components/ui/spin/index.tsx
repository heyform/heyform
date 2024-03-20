import clsx from 'clsx'
import type { FC } from 'react'

import { IComponentProps } from '../typing'

const Spin: FC<IComponentProps<HTMLOrSVGElement>> = ({ className, ...restProps }) => {
  return (
    <svg
      className={clsx('spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      {...restProps}
    >
      <circle
        className="spin-circle"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="spin-path"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export default Spin
