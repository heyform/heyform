import type { DateRangeValue } from '@heyform-inc/shared-types-enums'
import clsx from 'clsx'
import type { FC } from 'react'
import { useState } from 'react'

import { IComponentProps } from '../typings'
import { useTranslation } from '../utils'
import { DateInput } from './DateInput'

interface DateRangeInputProps extends Omit<IComponentProps, 'onChange' | 'onError'> {
  format?: string
  allowTime?: boolean
  value?: DateRangeValue
  onChange?: (value: DateRangeValue) => void
  onError?: (error: Error) => void
}

export const DateRangeInput: FC<DateRangeInputProps> = ({
  format = 'MM/DD/YYYY',
  allowTime,
  value: rawValue,
  onChange,
  onError
}) => {
  const { t } = useTranslation()
  const [value, setValue] = useState<DateRangeValue | undefined>(rawValue)

  function handleUpdate(newValue: DateRangeValue) {
    setValue(newValue)
    onChange && onChange(newValue)
  }

  function handleStartChange(start: string) {
    handleUpdate({
      ...value,
      start
    })
  }

  function handleEndChange(end: string) {
    handleUpdate({
      ...value,
      end
    })
  }

  return (
    <div
      className={clsx('heyform-range-root', {
        'heyform-range-width-time': allowTime
      })}
    >
      <DateInput
        value={value?.start}
        format={format}
        allowTime={allowTime}
        onChange={handleStartChange}
        onError={onError}
      />
      <div className="heyform-range-divider">{t('to')}</div>
      <DateInput
        value={value?.end}
        format={format}
        allowTime={allowTime}
        onChange={handleEndChange}
        onError={onError}
      />
    </div>
  )
}
