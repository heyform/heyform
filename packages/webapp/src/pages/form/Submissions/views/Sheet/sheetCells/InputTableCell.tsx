import { helper } from '@heyform-inc/utils'
import { FC, useMemo } from 'react'

import { SheetCellProps } from '../types'

export const InputTableCell: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => {
    const v = row[column.key]
    const columns = column.properties?.tableColumns

    if (helper.isValidArray(columns) && helper.isValidArray(v)) {
      const result: string[] = []

      v.forEach((r: Record<string, string>) => {
        if (helper.isValid(r) && helper.isObject(r)) {
          result.push(columns!.map(c => r[c.id]).join(', '))
        }
      })

      return result.join('|')
    }
  }, [column.key, column.properties?.tableColumns, row])

  return (
    <div className="heygrid-cell-text overflow-hidden text-ellipsis whitespace-nowrap">{value}</div>
  )
}
