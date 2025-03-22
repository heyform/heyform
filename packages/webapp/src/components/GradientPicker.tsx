import { FC } from 'react'

import { GRADIENTS } from '@/consts'

interface GradientPickerProps extends Omit<ComponentProps, 'onChange'> {
  onChange?: (value: string) => void
}

interface GradientItemProps extends GradientPickerProps {
  value: string
}

const GradientItem: FC<GradientItemProps> = ({ value, onChange }) => {
  function handleClick() {
    onChange?.(value)
  }

  return (
    <li className="w-1/2 pb-4 pl-2 pr-2 sm:w-1/3 lg:w-1/4" onClick={handleClick}>
      <div className="focus-within:ring-offset-foreground-100 group block h-20 cursor-pointer overflow-hidden rounded-md bg-slate-100 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: value
          }}
        />
      </div>
    </li>
  )
}

export const GradientPicker: FC<GradientPickerProps> = ({ onChange, ...restProps }) => {
  return (
    <div {...restProps}>
      <ul role="list" className="-ml-2 -mr-2 flex flex-wrap">
        {GRADIENTS.map((row, index) => (
          <GradientItem key={index} value={row} onChange={onChange} />
        ))}
      </ul>
    </div>
  )
}
