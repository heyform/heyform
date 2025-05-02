import { getDateFormat } from '@heyform-inc/answer-utils'
import { helper } from '@heyform-inc/utils'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { startTransition, useState } from 'react'

import { Input } from '../components'
import { DATE_FORMATS, DATE_MAPS, FILTER_NUMBER_REGEX, NUMERIC_REGEX, TIME_FORMAT } from '../consts'
import { useTranslation } from '../utils'

type FormatType = 'YYYY' | 'MM' | 'DD' | 'HH' | 'mm'

interface DateInputProps extends Omit<IComponentProps, 'onChange' | 'onError'> {
  format?: string
  allowTime?: boolean
  value?: string
  onChange?: (value: string) => void
  onError?: (error: Error) => void
}

interface DateItemProps extends Omit<DateInputProps, 'value' | 'onChange' | 'onError'> {
  format: FormatType
  value?: string | number
  onChange: (format: FormatType, value?: number) => void
  onError?: (error: Error) => void
}

const DateItem: FC<DateItemProps> = ({ format, value: rawValue = '', onChange, onError }) => {
  const { t } = useTranslation()
  const { id, label, maxLength, minValue, maxValue } = DATE_MAPS[format]
  const [value, setValue] = useState<string>(String(rawValue)?.replace(FILTER_NUMBER_REGEX, ''))

  function handleUpdate(val: string) {
    setValue(val)
    startTransition(() => {
      onChange?.(format, Number(val))
    })
  }

  function handleChange(newValue: any) {
    if (!NUMERIC_REGEX.test(newValue)) {
      newValue = newValue.replace(FILTER_NUMBER_REGEX, '')
      onError?.(new Error('Numbers only'))
    } else if (newValue.length >= maxLength) {
      if (newValue.length > maxLength) {
        newValue = newValue.slice(0, maxLength)
        onError?.(new Error(`The ${label.toLowerCase()} isn't valid`))
      } else {
        const numberValue = Number(newValue)

        if (numberValue > maxValue || numberValue < minValue) {
          newValue = newValue.slice(0, maxLength - 1)
          onError?.(new Error(`The ${label.toLowerCase()} isn't valid`))
        }
      }
    }

    handleUpdate(newValue)
  }

  return (
    <div className={`heyform-date-input heyform-date-item-${id}`}>
      <label htmlFor={`heyform-date-${id}`} className="heyform-date-label">
        {t(label)}
      </label>
      <Input id={`heyform-date-${id}`} value={value} placeholder={format} onChange={handleChange} />
    </div>
  )
}

function padding(value: string | number, maxLength: number) {
  return String(value).padStart(maxLength, '0')
}

function parseDate(value?: string, allowTime?: boolean): IMapType<string> {
  if (helper.isValid(value)) {
    const date = dayjs(value)

    if (date.isValid()) {
      const result: IMapType<string> = {
        YYYY: padding(date.year(), DATE_MAPS.YYYY.maxLength),
        MM: padding(date.month() + 1, DATE_MAPS.MM.maxLength),
        DD: padding(date.date(), DATE_MAPS.DD.maxLength)
      }

      if (allowTime) {
        result.HH = padding(date.hour(), DATE_MAPS.HH.maxLength)
        result.mm = padding(date.minute(), DATE_MAPS.mm.maxLength)
      }

      return result
    }
  }

  return {}
}

function formatDate(value: IMapType<number>, format: string, allowTime?: boolean): string {
  let result = getDateFormat(format, allowTime)

  for (const key of Object.keys(value)) {
    result = result.replace(key, padding(value[key] ?? '', DATE_MAPS[key].maxLength))
  }

  return result
}

export const DateInput: FC<DateInputProps> = ({
  format = 'MM/DD/YYYY',
  allowTime,
  value: rawValue,
  onChange,
  onError
}) => {
  const [year, month, day, divider] = DATE_FORMATS[format]
  const [hour, minute, timeDivider] = DATE_FORMATS[TIME_FORMAT]
  const [value, setValue] = useState<IMapType<string>>(parseDate(rawValue, allowTime))

  function handleChange(f: FormatType, v?: number) {
    const newValue: any = { ...value, [f]: v }

    setValue(newValue)
    startTransition(() => {
      onChange?.(formatDate(newValue, format, allowTime))
    })
  }

  return (
    <div className="heyform-date-root">
      <DateItem format={year} value={value[year]} onChange={handleChange} onError={onError} />
      <div className="heyform-date-divider">{divider}</div>
      <DateItem format={month} value={value[month]} onChange={handleChange} onError={onError} />
      <div className="heyform-date-divider">{divider}</div>
      <DateItem format={day} value={value[day]} onChange={handleChange} onError={onError} />

      {allowTime && (
        <>
          <DateItem format={hour} value={value[hour]} onChange={handleChange} onError={onError} />
          <div className="heyform-date-divider">{timeDivider}</div>
          <DateItem
            format={minute}
            value={value[minute]}
            onChange={handleChange}
            onError={onError}
          />
        </>
      )}
    </div>
  )
}
