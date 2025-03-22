import { IconChevronDown } from '@tabler/icons-react'
import type { FC } from 'react'

export const FakeSelect: FC<ComponentProps & { placeholder?: string }> = ({
  placeholder,
  ...restProps
}) => {
  return (
    <div className="heyform-select" {...restProps}>
      <div className="heyform-select-container">
        {/* @ts-ignore */}
        <span className="heyform-select-value" placeholder={placeholder} />
        <span className="heyform-select-arrow-icon">
          <IconChevronDown />
        </span>
      </div>
    </div>
  )
}
