import clsx from 'clsx'
import type { FC } from 'react'

export const WorkspaceIcon: FC<IComponentProps<HTMLOrSVGElement>> = ({
  className,
  ...restProps
}) => (
  <svg
    className={clsx('avatar-placeholder', className)}
    viewBox="0 0 28 28"
    xmlns="http://www.w3.org/2000/svg"
    {...restProps}
  >
    <path
      d="M15 19.25a.75.75 0 001.086.67l3-1.5a.75.75 0 00.415-.67v-4.323a.75.75 0 00-1.086-.67l-3 1.5a.75.75 0 00-.415.67v4.323zm3.159-8.043a.75.75 0 000-1.341l-3.573-1.787a.75.75 0 00-.67 0l-3.574 1.787a.75.75 0 000 1.34l3.573 1.787a.749.749 0 00.67 0l3.574-1.786zm-8.074 1.55a.75.75 0 00-1.085.67v4.323a.75.75 0 00.415.67l3 1.5a.75.75 0 001.085-.67v-4.323a.75.75 0 00-.415-.67l-3-1.5z"
      fill="currentColor"
    />
  </svg>
)
