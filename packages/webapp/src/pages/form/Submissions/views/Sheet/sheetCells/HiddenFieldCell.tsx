import { helper } from '@heyform-inc/utils'
import { FC, useMemo } from 'react'

import { SheetCellProps } from '../types'

export const HiddenFieldCell: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => {
    const v = row[column.name as string]

    if (helper.isString(v) || helper.isNumber(v)) {
      return v
    }
  }, [column.name, row])

  return (
    <div className="heygrid-cell-text overflow-hidden text-ellipsis whitespace-nowrap">{value}</div>
  )
}
