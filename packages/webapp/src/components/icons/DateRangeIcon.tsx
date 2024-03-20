import type { FC } from 'react'

export const DateRangeIcon: FC<IComponentProps<HTMLOrSVGElement>> = props => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
      <g fill="none" fillRule="evenodd">
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5,4 L5,0 M13,4 L13,0 M4,8 L14,8 M4,13 L10,13 M2,18 L16,18 C17.1046,18 18,17.1046 18,16 L18,4 C18,2.89543 17.1046,2 16,2 L2,2 C0.89543,2 0,2.89543 0,4 L0,16 C0,17.1046 0.89543,18 2,18 Z"
          transform="translate(3 3)"
        />
        <rect width="24" height="24" />
      </g>
    </svg>
  )
}
