import clsx from 'clsx'
import { FC, memo, useContext, useMemo } from 'react'

import { MONTHS } from './common'
import { DatePickerStore } from './store'
import { isSameMonth } from './utils'

const MonthCell: FC<{ month: number }> = ({ month }) => {
  const { temp, current, updateMonth } = useContext(DatePickerStore)
  const isSelected = useMemo(
    () => isSameMonth(temp, current) && current.month() === month,
    [month, temp, current]
  )

  function handleClick() {
    updateMonth(month)
  }

  return (
    <div
      className={clsx('datepicker-cell', {
        'datepicker-cell-selected': isSelected
      })}
      onClick={handleClick}
    >
      {month + 1}
    </div>
  )
}

const MonthPicker = () => {
  return (
    <div className="datepicker-month-picker">
      {MONTHS.map((row, index) => (
        <div key={index} className="datepicker-row">
          {row.map(month => (
            <MonthCell key={month} month={month} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default memo(MonthPicker)
