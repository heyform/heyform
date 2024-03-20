import { FC } from 'react'

import { TagGroup } from '@/components'

import { SheetCellProps } from '../types'

export const MultipleChoiceCell: FC<SheetCellProps> = ({ column, row }) => {
  const value = row[column.key]?.value
  const choices = column.properties?.choices?.filter(choice => value?.includes(choice.id))

  return (
    <>
      {choices && (
        <div className="heygrid-cell-text flex items-center overflow-hidden text-ellipsis whitespace-nowrap">
          <TagGroup tags={choices || []} />
        </div>
      )}
    </>
  )
}
