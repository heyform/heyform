import { helper } from '@heyform-inc/utils'
import { FC, useMemo } from 'react'

import { getUrlValue } from '@/utils'

import { SheetCellProps } from '../types'

export const UrlCell: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => getUrlValue(row[column.key]), [column.key, row])

  return (
    <div className="heygrid-cell-text overflow-hidden text-ellipsis whitespace-nowrap">
      <a href={value} target="_blank" rel="noreferrer">
        {value}
      </a>
    </div>
  )
}
