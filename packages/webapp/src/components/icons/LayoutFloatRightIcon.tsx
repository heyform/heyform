import type { FC } from 'react'

export const LayoutFloatRightIcon: FC<IComponentProps<HTMLOrSVGElement>> = props => {
  return (
    <svg
      width="64"
      height="40"
      viewBox="0 0 64 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M12 22H24V24H12V22Z" fill="currentColor" />
      <path d="M36 14H52V26H36V14Z" fill="currentColor" />
      <path d="M12 16H28V18H12V16Z" fill="currentColor" />
    </svg>
  )
}
