import { Dayjs } from 'dayjs'
import { FC, useCallback } from 'react'

import { DatePicker } from '@/components/ui'

interface DateRangePickerProps {
  dateFormat?: string
  timeFormat?: string
  startDate?: Dayjs
  endDate?: Dayjs
  onChange?: (startDate?: Dayjs, endDate?: Dayjs) => void
}

export const DateRangePicker: FC<DateRangePickerProps> = ({
  dateFormat = 'MMM DD, YYYY',
  timeFormat = 'hh:mm A',
  startDate,
  endDate,
  onChange
}) => {
  const handleStartChange = useCallback(
    (value: any) => {
      onChange?.(value, endDate)
    },
    [endDate]
  )

  const handleEndChange = useCallback(
    (value: any) => {
      onChange?.(startDate, value)
    },
    [startDate]
  )

  return (
    <div className="flex items-center">
      <DatePicker
        format={dateFormat}
        timeFormat={timeFormat}
        showTimeSelect
        onChange={handleStartChange}
      />
      <span className="px-2">-</span>
      <DatePicker
        format={dateFormat}
        timeFormat={timeFormat}
        minDate={startDate}
        showTimeSelect
        onChange={handleEndChange}
      />
    </div>
  )
}
