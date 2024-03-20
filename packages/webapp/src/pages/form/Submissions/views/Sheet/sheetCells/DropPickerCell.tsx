import { FC } from 'react'

import { TagGroup } from '@/components'

import { SheetCellProps } from '../types'

export const DropPickerCell: FC<SheetCellProps> = ({ column, row }) => {
  const value = row[column.key]
  const choice = column.properties?.choices?.find(choice => choice.id === value)

  return (
    <>
      {choice && (
        <div className="heygrid-cell-text flex items-center overflow-hidden text-ellipsis whitespace-nowrap">
          <TagGroup className="px-4" tags={[choice]} />
        </div>
      )}
    </>
  )
}
