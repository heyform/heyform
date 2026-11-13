import { describe, expect, it } from 'vitest'

import { parseStoredDate } from '../src/utils/parse-stored-date'

describe('parseStoredDate', () => {
  const cases: {
    name: string
    value: string
    format: string
    allowTime?: boolean
    expected: Record<string, string>
  }[] = [
    {
      name: 'DD/MM/YYYY keeps day and month',
      value: '25/03/2024',
      format: 'DD/MM/YYYY',
      expected: { DD: '25', MM: '03', YYYY: '2024' }
    },
    {
      name: 'DD/MM/YYYY day > 12',
      value: '31/12/2024',
      format: 'DD/MM/YYYY',
      expected: { DD: '31', MM: '12', YYYY: '2024' }
    },
    {
      name: 'DD/MM/YYYY swaps when day <= 12',
      value: '05/03/2024',
      format: 'DD/MM/YYYY',
      expected: { DD: '05', MM: '03', YYYY: '2024' }
    },
    {
      name: 'DD-MM-YYYY',
      value: '25-03-2024',
      format: 'DD-MM-YYYY',
      expected: { DD: '25', MM: '03', YYYY: '2024' }
    },
    {
      name: 'DD.MM.YYYY',
      value: '25.03.2024',
      format: 'DD.MM.YYYY',
      expected: { DD: '25', MM: '03', YYYY: '2024' }
    },
    {
      name: 'DD/MM/YYYY with time',
      value: '25/03/2024 14:30',
      format: 'DD/MM/YYYY',
      allowTime: true,
      expected: { DD: '25', MM: '03', YYYY: '2024', HH: '14', mm: '30' }
    },
    {
      name: 'MM/DD/YYYY unchanged',
      value: '03/25/2024',
      format: 'MM/DD/YYYY',
      expected: { MM: '03', DD: '25', YYYY: '2024' }
    },
    {
      name: 'YYYY-MM-DD ISO field format',
      value: '2024-03-25',
      format: 'YYYY-MM-DD',
      expected: { YYYY: '2024', MM: '03', DD: '25' }
    }
  ]

  it.each(cases)('$name', ({ value, format, allowTime, expected }) => {
    expect(parseStoredDate(value, format, allowTime)).toEqual(expected)
  })

  it('returns empty object for invalid date', () => {
    expect(parseStoredDate('99/99/2024', 'DD/MM/YYYY')).toEqual({})
  })

  it('returns empty object for empty input', () => {
    expect(parseStoredDate('', 'DD/MM/YYYY')).toEqual({})
  })
})
