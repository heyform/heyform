import type { FC } from 'react'

export const LayoutSplitLeftIcon: FC<IComponentProps<HTMLOrSVGElement>> = props => {
  return (
    <svg
      width="64"
      height="40"
      viewBox="0 0 64 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M38 22H50V24H38V22Z" fill="currentColor" />
      <path
        d="M3 9C3 5.68629 5.68629 3 9 3H30V37H9C5.68629 37 3 34.3137 3 31V9Z"
        fill="currentColor"
      />
      <path d="M38 16H54V18H38V16Z" fill="currentColor" />
    </svg>
  )
}
