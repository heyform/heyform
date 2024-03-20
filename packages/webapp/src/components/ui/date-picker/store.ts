import { Dayjs } from 'dayjs'
import { createContext } from 'react'

import { DatePickerCommonOptions } from './common'

interface IStore extends DatePickerCommonOptions {
  format?: string
  timeFormat?: string
  value?: Dayjs
  temp: Dayjs
  current: Dayjs
  isYearPickerOpen?: boolean
  isMonthPickerOpen?: boolean
  togglePicker: () => void
  toggleYearPicker: () => void
  toggleMonthPicker: () => void
  toPrevious: () => void
  toNext: () => void
  updateYear: (year: number) => void
  updateMonth: (month: number) => void
  updateValue: (date: Dayjs) => void
  setIsOpen: (open: boolean) => void
}

export const DatePickerStore = createContext<IStore>({} as IStore)
