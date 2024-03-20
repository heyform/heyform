import clsx from 'clsx'
import type { FC, SVGAttributes } from 'react'

const Loader: FC<SVGAttributes<HTMLOrSVGElement>> = ({ className, ...restProps }) => {
  return (
    <svg
      width="22"
      height="5"
      viewBox="0 0 21 5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('loader', className)}
      {...restProps}
    >
      <rect className="loader-span" width="5" height="5" rx="2.5" fill="currentColor" />
      <rect className="loader-span" x="8" width="5" height="5" rx="2.5" fill="currentColor" />
      <rect className="loader-span" x="16" width="5" height="5" rx="2.5" fill="currentColor" />
    </svg>
  )
}

export default Loader
