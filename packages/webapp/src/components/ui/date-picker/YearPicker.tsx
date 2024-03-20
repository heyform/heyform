import clsx from 'clsx'
import { FC, memo, useContext, useMemo } from 'react'

import { YEAR_INTERVAL } from './common'
import { DatePickerStore } from './store'
import { getStartYear } from './utils'

const YearCell: FC<{ year: number }> = ({ year }) => {
  const { current, updateYear } = useContext(DatePickerStore)

  function handleClick() {
    updateYear(year)
  }

  return (
    <div
      className={clsx('datepicker-cell', {
        'datepicker-cell-selected': current.year() === year
      })}
      onClick={handleClick}
    >
      {year}
    </div>
  )
}

const YearPicker = ({}) => {
  const { temp } = useContext(DatePickerStore)

  const years = useMemo(() => {
    const startYear = getStartYear(temp)
    const arr = Array.from({ length: YEAR_INTERVAL }, (_, index) => startYear + index)

    return Array.from({ length: 5 }, (_, index) => {
      return arr.slice(index * 4, (index + 1) * 4)
    })
  }, [temp])

  return (
    <div className="datepicker-year-picker">
      {years.map((row, index) => (
        <div key={index} className="datepicker-row">
          {row.map(year => (
            <YearCell key={year} year={year} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default memo(YearPicker)
