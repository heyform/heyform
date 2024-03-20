import type { FC } from 'react'

export const WelcomeIcon: FC<IComponentProps<HTMLOrSVGElement>> = props => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M13 19V5M13 19C13 20.1046 12.1046 21 11 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3L11 3C12.1046 3 13 3.89543 13 5M13 19H15C16.1046 19 17 18.1046 17 17M13 5H15C16.1046 5 17 5.89543 17 7M17 7H19C20.1046 7 21 7.89543 21 9V15C21 16.1046 20.1046 17 19 17H17M17 7V17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
