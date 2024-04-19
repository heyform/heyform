import type { FC } from 'react'

import { IComponentProps } from '@/components/ui/typing'

export const EmotionIcon: FC<IComponentProps<HTMLOrSVGElement>> = props => {
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
        d="M12 22C17.5229 22 22 17.5229 22 12C22 6.47715 17.5229 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5229 6.47715 22 12 22Z"
        className="heyform-icon-fill heyform-icon-stroke"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 9V9.5M8.5 9V9.5M15.5 15.5C15.5 15.5 14.5 17.5 12 17.5C9.5 17.5 8.5 15.5 8.5 15.5"
        className="heyform-icon-stroke"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
