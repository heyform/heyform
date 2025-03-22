import {
  Content,
  DropdownMenuContentProps,
  Item,
  Portal,
  Root,
  Trigger
} from '@radix-ui/react-dropdown-menu'
import { FC, MouseEvent, ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/utils'

interface DropdownOption {
  icon?: ReactNode
  disabled?: boolean
  [key: string]: any
}

interface DropdownProps extends Omit<ComponentProps, 'onClick'> {
  contentProps?: DropdownMenuContentProps
  options: DropdownOption[]
  labelKey?: string
  valueKey?: string
  multiLanguage?: boolean
  disabled?: boolean
  onClick?: (value: string) => void
}

interface DropdownItemProps {
  option: DropdownOption
  onClick?: (value: string) => void
}

const DropdownItem: FC<DropdownItemProps> = ({ option, onClick }) => {
  function handleClick(event: MouseEvent) {
    event.stopPropagation()
    onClick?.(option.value)
  }

  return (
    <Item
      key={option.value}
      className="flex cursor-pointer items-center gap-x-2 rounded-lg border-0 px-3.5 py-2.5 text-left text-base/6 outline-none focus-visible:outline-none disabled:opacity-60 data-[highlighted]:bg-accent-light sm:px-3 sm:py-1.5 sm:text-sm/6"
      data-slot="item"
      data-value={option.value}
      disabled={option.disabled}
      onClick={handleClick}
    >
      {option.icon}
      {option.label}
    </Item>
  )
}

export const Dropdown: FC<DropdownProps> = ({
  options: rawOptions = [],
  labelKey = 'label',
  valueKey = 'value',
  contentProps,
  disabled,
  multiLanguage,
  children,
  onClick
}) => {
  const { t } = useTranslation()

  const options = useMemo(
    () =>
      rawOptions.map(row => {
        const value = row[valueKey]
        const label = row[labelKey]

        return {
          value,
          label: multiLanguage ? t(label) : label,
          icon: row.icon,
          disabled: row.disabled
        }
      }),
    [rawOptions, valueKey, labelKey, multiLanguage, t]
  )

  return (
    <Root>
      <Trigger disabled={disabled} asChild>
        {children}
      </Trigger>
      <Portal>
        <Content
          side="bottom"
          align="end"
          {...contentProps}
          className={cn(
            'isolate z-10 w-max overflow-y-auto rounded-xl bg-foreground p-1 shadow-lg outline outline-1 outline-transparent ring-1 ring-accent-light animate-in fade-in-0 zoom-in-95 focus:outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            contentProps?.className
          )}
        >
          {options.map(row => (
            <DropdownItem key={row.value} option={row} onClick={onClick} />
          ))}
        </Content>
      </Portal>
    </Root>
  )
}
