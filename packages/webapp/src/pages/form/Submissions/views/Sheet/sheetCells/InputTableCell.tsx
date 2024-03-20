import { helper } from '@heyform-inc/utils'
import { FC } from 'react'

import { SheetCellProps } from '../types'

export const InputTableCell: FC<SheetCellProps> = ({ column, row }) => {
  const value = row[column.key]
  const columns = column.properties?.tableColumns
  let text = ''

  if (helper.isValidArray(columns) && helper.isValid(value)) {
    const result: string[] = []

    value.forEach((v: Record<string, string>) => {
      if (helper.isValid(v)) {
        result.push(columns!.map(c => v[c.id]).join(', '))
      }
    })

    text = result.join('|')
  }

  return (
    <div className="heygrid-cell-text overflow-hidden text-ellipsis whitespace-nowrap">{text}</div>
  )
}
