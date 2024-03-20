import clsx from 'clsx'
import { FC, ReactNode } from 'react'

interface HeadingProps extends IComponentProps {
  description?: ReactNode
  headlineClassName?: string
  subheadlineClassName?: string
}

export const Heading: FC<HeadingProps> = ({
  headlineClassName,
  subheadlineClassName,
  description,
  children,
  ...restProps
}) => {
  return (
    <div className="mb-6" {...restProps}>
      <div
        className={clsx(
          'heading-title text-[30px] font-semibold leading-[1.4] text-[#323b4b]',
          headlineClassName
        )}
      >
        {children}
      </div>
      {description && (
        <div
          className={clsx(
            'heading-description mt-2 text-base leading-6 text-[#000000]',
            subheadlineClassName
          )}
        >
          {description}
        </div>
      )}
    </div>
  )
}
