import type { FC } from 'react'

import { IComponentProps } from '@/components/ui/typing'

export const ThumbsUpIcon: FC<IComponentProps<HTMLOrSVGElement>> = props => {
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
        d="M13.8 9.3V5.7C13.8 4.20883 12.5912 3 11.1 3L7.5 11.1V16.05V21H17.958C18.8556 21.0102 19.6234 20.3574 19.758 19.47L21 11.37C21.0793 10.8478 20.9252 10.3173 20.5786 9.91875C20.2321 9.52025 19.7281 9.294 19.2 9.3H13.8Z"
        className="heyform-icon-fill"
      />
      <path
        d="M7.5 11.0001H5.097C4.04266 10.9815 3.14135 11.8548 3 12.8998V19.1998C3.14135 20.2448 4.04266 21.0184 5.097 20.9998L7.5 21V11.0001Z"
        className="heyform-icon-fill"
      />
      <path
        d="M7.5 21H17.958C18.8556 21.0102 19.6234 20.3574 19.758 19.47L21 11.37C21.0793 10.8478 20.9252 10.3173 20.5786 9.91875C20.2321 9.52025 19.7281 9.294 19.2 9.3H13.8V5.7C13.8 4.20883 12.5912 3 11.1 3L7.5 11.1V16.05V21ZM7.5 21L5.097 20.9998C4.04266 21.0184 3.14135 20.2448 3 19.1998V12.8998C3.14135 11.8548 4.04266 10.9815 5.097 11.0001H7.5V21Z"
        className="heyform-icon-stroke"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}
