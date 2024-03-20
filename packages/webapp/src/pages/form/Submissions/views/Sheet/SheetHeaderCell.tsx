import { FC } from 'react'

import { SheetKindIcon } from './SheetKindIcon'
import { SheetHeaderCellProps } from './types'

export const SheetHeaderCell: FC<SheetHeaderCellProps> = ({ column }) => {
  return (
    <div className="heygrid-header-cell flex items-center bg-white">
      <SheetKindIcon className="mr-2 h-[22px] w-[22px] p-0.5" kind={column.kind!} />
      <span className="h-full flex-1 truncate">{column.name}</span>
    </div>
  )
}
