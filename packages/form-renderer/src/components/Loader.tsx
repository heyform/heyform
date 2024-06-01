import clsx from 'clsx'
import type { FC, SVGAttributes } from 'react'

export const Loader: FC<SVGAttributes<HTMLOrSVGElement>> = ({ className, ...restProps }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
         className={clsx('!w-6 !h-6 !mx-0 animate-spin', className)} {...restProps}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2"
              strokeLinejoin="round" />
      <path
        d="M6.70993 19.2812C5.1723 18.164 4.02781 16.5887 3.44049 14.7812C2.85317 12.9736 2.85317 11.0264 3.44049 9.21885C4.02781 7.41126 5.1723 5.836 6.70993 4.71885C8.24756 3.60169 10.0994 3 12 3"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
