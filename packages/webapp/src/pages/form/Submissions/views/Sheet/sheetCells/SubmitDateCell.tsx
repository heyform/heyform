import { unixDate } from '@heyform-inc/utils'
import { FC } from 'react'

import { SheetCellProps } from '../types'

export const SubmitDateCell: FC<SheetCellProps> = ({ row }) => {
  const value: number = row.endAt ?? 0

  return (
    <div className="heygrid-cell-text overflow-hidden text-ellipsis whitespace-nowrap">
      {unixDate(value).format('MMM DD, YYYY')}
    </div>
  )
}
