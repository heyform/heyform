import type { FC } from 'react'

import { IComponentProps } from '@/components/ui/typing'

export const CrownIcon: FC<IComponentProps<HTMLOrSVGElement>> = props => {
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
        d="M6.5 21H17.5L20.5 10.5L15.5 13L12 6L8.5 13L3.5 10.5L6.5 21Z"
        className="heyform-icon-fill heyform-icon-stroke"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 10.5C4.32843 10.5 5 9.82843 5 9C5 8.17157 4.32843 7.5 3.5 7.5C2.67157 7.5 2 8.17157 2 9C2 9.82843 2.67157 10.5 3.5 10.5Z"
        className="heyform-icon-fill"
      />
      <path
        d="M12 6C12.8284 6 13.5 5.32843 13.5 4.5C13.5 3.67157 12.8284 3 12 3C11.1716 3 10.5 3.67157 10.5 4.5C10.5 5.32843 11.1716 6 12 6Z"
        className="heyform-icon-fill"
      />
      <path
        d="M20.5 10.5C21.3284 10.5 22 9.82843 22 9C22 8.17157 21.3284 7.5 20.5 7.5C19.6716 7.5 19 8.17157 19 9C19 9.82843 19.6716 10.5 20.5 10.5Z"
        className="heyform-icon-fill"
      />
      <path
        d="M3.5 10.5C4.32843 10.5 5 9.82843 5 9C5 8.17157 4.32843 7.5 3.5 7.5C2.67157 7.5 2 8.17157 2 9C2 9.82843 2.67157 10.5 3.5 10.5Z"
        className="heyform-icon-stroke"
        strokeWidth="1"
      />
      <path
        d="M12 6C12.8284 6 13.5 5.32843 13.5 4.5C13.5 3.67157 12.8284 3 12 3C11.1716 3 10.5 3.67157 10.5 4.5C10.5 5.32843 11.1716 6 12 6Z"
        className="heyform-icon-stroke"
        strokeWidth="1"
      />
      <path
        d="M20.5 10.5C21.3284 10.5 22 9.82843 22 9C22 8.17157 21.3284 7.5 20.5 7.5C19.6716 7.5 19 8.17157 19 9C19 9.82843 19.6716 10.5 20.5 10.5Z"
        className="heyform-icon-stroke"
        strokeWidth="1"
      />
    </svg>
  )
}
