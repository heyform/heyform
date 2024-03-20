import type { FC } from 'react'

export const SignatureIcon: FC<IComponentProps<HTMLOrSVGElement>> = props => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M8.4 12H5.25C4.00736 12 3 13.0074 3 14.25C3 15.4926 4.00736 16.5 5.25 16.5H18.75C19.9926 16.5 21 17.5074 21 18.75C21 19.9926 19.9926 21 18.75 21H9.3M12 12V9.75L18.75 3L21 5.25L14.25 12H12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
