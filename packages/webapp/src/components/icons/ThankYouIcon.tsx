import type { FC } from 'react'

export const ThankYouIcon: FC<IComponentProps<HTMLOrSVGElement>> = props => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M11 5L11 19M11 5C11 3.89543 11.8954 3 13 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H13C11.8954 21 11 20.1046 11 19M11 5H9C7.89543 5 7 5.89543 7 7M11 19H9C7.89543 19 7 18.1046 7 17M7 17H5C3.89543 17 3 16.1046 3 15L3 9C3 7.89543 3.89543 7 5 7H7M7 17L7 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
