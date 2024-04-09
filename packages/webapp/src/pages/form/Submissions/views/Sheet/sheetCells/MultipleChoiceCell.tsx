import { helper } from '@heyform-inc/utils'
import { FC, useMemo } from 'react'

import { TagGroup } from '@/components'

import { SheetCellProps } from '../types'

export const MultipleChoiceCell: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => {
    const v = row[column.key]?.value
    const choices = column.properties?.choices

    if (helper.isValidArray(v) && helper.isValidArray(choices)) {
      return choices!.filter(choice => v!.includes(choice.id)) || []
    }

    return []
  }, [column.key, column.properties?.choices, row])

  return (
    <div className="heygrid-cell-text flex items-center overflow-hidden text-ellipsis whitespace-nowrap">
      <TagGroup tags={value} />
    </div>
  )
}
