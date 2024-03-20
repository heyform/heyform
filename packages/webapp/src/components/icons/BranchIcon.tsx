import type { FC } from 'react'

export const BranchIcon: FC<IComponentProps<HTMLOrSVGElement>> = props => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M6.30438 11.3217H13.6783C15.7146 11.3217 17.3653 12.9724 17.3653 15.0087V15.8201"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.60873 5.30437C8.60873 4.03171 7.57703 3.00001 6.30436 3.00001C5.0317 3.00001 4 4.03171 4 5.30437C4 6.57704 5.0317 7.60873 6.30436 7.60873C7.57703 7.60873 8.60873 6.57704 8.60873 5.30437Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M19.5827 18.6437C19.5827 17.371 18.551 16.3393 17.2784 16.3393C16.0057 16.3393 14.974 17.371 14.974 18.6437C14.974 19.9164 16.0057 20.9481 17.2784 20.9481C18.551 20.9481 19.5827 19.9164 19.5827 18.6437Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M6.30438 7.63467V21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
