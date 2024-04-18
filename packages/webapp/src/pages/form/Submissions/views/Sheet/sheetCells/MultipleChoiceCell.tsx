import { Choice } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { FC, useMemo } from 'react'

import { TagGroup } from '@/components'

import { SheetCellProps } from '../types'

export const MultipleChoiceCell: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => {
    const v = row[column.key]

    if (helper.isValid(v) && helper.isObject(v)) {
      const choices = column.properties?.choices

      if (helper.isValidArray(choices)) {
        let result: Choice[] = []

        if (helper.isValidArray(v?.value)) {
          result = choices!.filter(choice => v.value.includes(choice.id)) || []
        }

        if (v.other) {
          result.push({
            id: v.other,
            label: v.other
          })
        }

        return result
      }
    }

    return []
  }, [column.key, column.properties?.choices, row])

  return (
    <div className="heygrid-cell-text flex items-center overflow-hidden text-ellipsis whitespace-nowrap">
      <TagGroup tags={value} />
    </div>
  )
}
