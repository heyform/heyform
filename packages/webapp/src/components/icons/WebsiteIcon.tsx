import type { FC } from 'react'

export const WebsiteIcon: FC<IComponentProps<HTMLOrSVGElement>> = props => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M14.7 10.6H10.2C8.21176 10.6 6.6 12.2118 6.6 14.2C6.6 16.1882 8.21176 17.8 10.2 17.8H17.4C19.3882 17.8 21 16.1882 21 14.2C21 13.287 20.6601 12.4534 20.1 11.8188M3.9 12.9812C3.33987 12.3466 3 11.513 3 10.6C3 8.61176 4.61177 7 6.6 7H13.8C15.7882 7 17.4 8.61176 17.4 10.6C17.4 12.5882 15.7882 14.2 13.8 14.2H9.3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
