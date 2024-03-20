import { FC } from 'react'

import { SheetCellProps } from '../types'

export const SignatureCell: FC<SheetCellProps> = ({ column, row }) => {
  const value = row[column.key]
  return (
    <div className="heygrid-cell-text flex h-10 items-center overflow-hidden px-4 leading-[1px]">
      {value && <img className="h-5 w-11 object-cover" src={value} width={80} height={40} />}
    </div>
  )
}
