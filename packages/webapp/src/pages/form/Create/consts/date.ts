export const DATE_FORMAT_MAPS: IMapType = {
  'MM/DD/YYYY': ['MM', 'DD', 'YYYY', '/'],
  'DD/MM/YYYY': ['DD', 'MM', 'YYYY', '/'],
  'YYYY/MM/DD': ['YYYY', 'MM', 'DD', '/'],
  'MM-DD-YYYY': ['MM', 'DD', 'YYYY', '-'],
  'DD-MM-YYYY': ['DD', 'MM', 'YYYY', '-'],
  'YYYY-MM-DD': ['YYYY', 'MM', 'DD', '-'],
  'MM.DD.YYYY': ['MM', 'DD', 'YYYY', '.'],
  'DD.MM.YYYY': ['DD', 'MM', 'YYYY', '.'],
  'YYYY.MM.DD': ['YYYY', 'MM', 'DD', '.'],
  'HH:mm': ['HH', 'mm', ':']
}

export const DATE_FORMAT_OPTIONS: IOptionType[] = [
  {
    label: 'MM/DD/YYYY',
    value: 'MM/DD/YYYY'
  },
  {
    label: 'DD/MM/YYYY',
    value: 'DD/MM/YYYY'
  },
  {
    label: 'YYYY/MM/DD',
    value: 'YYYY/MM/DD'
  },
  {
    label: 'MM-DD-YYYY',
    value: 'MM-DD-YYYY'
  },
  {
    label: 'DD-MM-YYYY',
    value: 'DD-MM-YYYY'
  },
  {
    label: 'YYYY-MM-DD',
    value: 'YYYY-MM-DD'
  },
  {
    label: 'MM.DD.YYYY',
    value: 'MM.DD.YYYY'
  },
  {
    label: 'DD.MM.YYYY',
    value: 'DD.MM.YYYY'
  },
  {
    label: 'YYYY.MM.DD',
    value: 'YYYY.MM.DD'
  }
]

export const TIME_FORMAT = 'HH:mm'

export const DATE_FORMAT_NAMES: IMapType = {
  YYYY: {
    id: 'year',
    label: 'Year'
  },
  MM: {
    id: 'month',
    label: 'Month'
  },
  DD: {
    id: 'day',
    label: 'Day'
  },
  HH: {
    id: 'hour',
    label: 'Hour'
  },
  mm: {
    id: 'minute',
    label: 'Minute'
  }
}
