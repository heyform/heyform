import type { FC } from 'react'

export const BoldIcon: FC<IComponentProps<HTMLOrSVGElement>> = props => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M6 12V3H11.85C14.3275 3 16.336 5.01472 16.336 7.5C16.336 9.98526 14.3275 12 11.85 12H6ZM6 12H13.664C16.1416 12 18.15 14.0147 18.15 16.5C18.15 18.9853 16.1416 21 13.664 21H6V12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
