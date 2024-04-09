import { helper } from '@heyform-inc/utils'
import { FC, useMemo } from 'react'

import { SheetCellProps } from '../types'

export const OpinionScaleCell: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => {
    const v = row[column.key]

    return [helper.isString(v) || helper.isNumber(v) ? v : null, column.properties?.total]
      .filter(helper.isValid)
      .join(' / ')
  }, [column.key, column.properties?.total, row])

  return (
    <div className="heygrid-cell-text overflow-hidden text-ellipsis whitespace-nowrap">{value}</div>
  )
}
