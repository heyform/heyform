import type { FC } from 'react'

export const DateTimeIcon: FC<IComponentProps<HTMLOrSVGElement>> = props => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
      <g fill="none" fillRule="evenodd">
        <rect width="24" height="24" />
        <g
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          transform="translate(3 3)"
        >
          <path d="M5,4 L5,0 M13,4 L13,0 M2,18 L16,18 C17.1046,18 18,17.1046 18,16 L18,4 C18,2.89543 17.1046,2 16,2 L2,2 C0.89543,2 0,2.89543 0,4 L0,16 C0,17.1046 0.89543,18 2,18 Z" />
          <polyline points="9 7 9 11 12 14" />
        </g>
      </g>
    </svg>
  )
}
