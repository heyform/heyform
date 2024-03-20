import type { FC } from 'react'

export const LayoutFloatLeftIcon: FC<IComponentProps<HTMLOrSVGElement>> = props => {
  return (
    <svg
      width="64"
      height="40"
      viewBox="0 0 64 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M36 22H48V24H36V22Z" fill="currentColor" />
      <path d="M12 14H28V26H12V14Z" fill="currentColor" />
      <path d="M36 16H52V18H36V16Z" fill="currentColor" />
    </svg>
  )
}
