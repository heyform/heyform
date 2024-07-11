import { IconCheck, IconPhoto } from '@tabler/icons-react'
import clsx from 'clsx'
import type { FC, ReactNode } from 'react'

import { IComponentProps } from '../typings'
import { isURL, useKey } from '../utils'

export interface RadioOption {
  keyName?: string
  label: string
  value: any
  icon?: ReactNode
  image?: string
  enableImage?: boolean
  disabled?: boolean
}

interface RadioProps extends RadioOption, Omit<IComponentProps, 'onClick'> {
  isChecked?: boolean
  isHotkeyShow?: boolean
  onClick?: (value: any) => void
}

export const Radio: FC<RadioProps> = ({
  className,
  keyName,
  image,
  label,
  value,
  icon,
  enableImage,
  isHotkeyShow,
  disabled,
  isChecked,
  onClick,
  ...restProps
}) => {
  function handleClick() {
    if (!disabled) {
      onClick?.(value)
    }
  }

  useKey(keyName?.toLowerCase() as string, handleClick)

  return (
    <div
      className={clsx(
        'heyform-radio',
        {
          'heyform-radio-selected': isChecked
        },
        className
      )}
      onClick={handleClick}
      {...restProps}
    >
      <div className="heyform-radio-container">
        {enableImage && (
          <div className="heyform-radio-image">
            {isURL(image) ? (
              <img src={image} alt={label} />
            ) : icon ? (
              icon
            ) : (
              <IconPhoto className="heyform-radio-placeholder" />
            )}
          </div>
        )}
        <div className="heyform-radio-content">
          {keyName && isHotkeyShow && <div className="heyform-radio-hotkey">{keyName}</div>}
          <div className="heyform-radio-label">{label}</div>
        </div>
        <div className="heyform-radio-icon">
          <IconCheck />
        </div>
      </div>
    </div>
  )
}
