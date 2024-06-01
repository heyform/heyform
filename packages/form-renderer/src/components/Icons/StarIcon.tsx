import type { FC } from 'react'

import { IComponentProps } from '../../typings'

export const StarIcon: FC<IComponentProps<HTMLOrSVGElement>> = props => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="heyform-icon"
      {...props}
    >
      <path
        d="M11.9993 2.5L8.9428 8.7388L2 9.74555L7.02945 14.6625L5.8272 21.5L11.9993 18.2096L18.1727 21.5L16.9793 14.6625L22 9.74555L15.0956 8.7388L11.9993 2.5Z"
        className="heyform-icon-fill heyform-icon-stroke"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}
