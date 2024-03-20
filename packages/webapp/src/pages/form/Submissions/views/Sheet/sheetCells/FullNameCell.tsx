import { FullNameValue } from '@heyform-inc/shared-types-enums'
import { FC } from 'react'

import { SheetCellProps } from '../types'

export const FullNameCell: FC<SheetCellProps> = ({ column, row }) => {
  const value: FullNameValue = row[column.key]

  return (
    <div className="heygrid-cell-text overflow-hidden text-ellipsis whitespace-nowrap">
      {value && (
        <>
          {value.firstName} {value.lastName}
        </>
      )}
    </div>
  )
}
