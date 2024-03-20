import { AddressValue } from '@heyform-inc/shared-types-enums'
import { FC } from 'react'

import { SheetCellProps } from '../types'

export const AddressCell: FC<SheetCellProps> = ({ column, row }) => {
  const value: AddressValue = row[column.key]
  return (
    <div className="heygrid-cell-text overflow-hidden text-ellipsis whitespace-nowrap">
      {value && (
        <>
          {value.address1}, {value.address2} {value.city}, {value.state}, {value.zip}
        </>
      )}
    </div>
  )
}
