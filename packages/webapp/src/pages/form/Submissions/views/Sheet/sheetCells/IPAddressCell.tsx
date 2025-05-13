import { helper } from '@heyform-inc/utils'
import { FC, useMemo } from 'react'

import { SheetCellProps } from '../types'

export const IPAddressCell: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => {
    const v = row[column.key]
    
    if (helper.isString(v)) {
      return v
    }
    
    return 'N/A'
  }, [column.key, row])

  return (
    <div className="heygrid-cell-text overflow-hidden text-ellipsis whitespace-nowrap">{value}</div>
  )
} 