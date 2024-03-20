import type { FC } from 'react'

export const LayoutInlineIcon: FC<IComponentProps<HTMLOrSVGElement>> = props => {
  return (
    <svg
      width="64"
      height="40"
      viewBox="0 0 64 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M20 9H32V11H20V9Z" fill="currentColor" />
      <path d="M20 14H44V26H20V14Z" fill="currentColor" />
      <path d="M20 29H36V31H20V29Z" fill="currentColor" />
    </svg>
  )
}
