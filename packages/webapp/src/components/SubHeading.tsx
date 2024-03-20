import { FC, ReactNode } from 'react'

interface SubHeadingProps extends IComponentProps {
  id?: string
  description?: ReactNode
  action?: ReactNode
}

export const SubHeading: FC<SubHeadingProps> = ({
  children,
  description,
  action,
  ...restProps
}) => {
  return (
    <div className="mb-5 mt-11 flex items-center justify-between" {...restProps}>
      <div>
        <div className="subheading-title mb-3 text-base font-medium leading-relaxed text-gray-700">
          {children}
        </div>
        {description && (
          <div className="subheading-description mt-1 text-gray-500">{description}</div>
        )}
      </div>
      {action && action}
    </div>
  )
}
