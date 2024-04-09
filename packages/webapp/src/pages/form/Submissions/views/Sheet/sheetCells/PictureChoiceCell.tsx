import { helper } from '@heyform-inc/utils'
import { IconPhoto } from '@tabler/icons-react'
import { FC, useMemo } from 'react'

import { SheetCellProps } from '../types'

export const PictureChoiceCell: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => {
    const v = row[column.key]?.value
    const choices = column.properties?.choices

    if (helper.isValidArray(v) && helper.isValidArray(choices)) {
      return choices!.filter(choice => v!.includes(choice.id)) || []
    }

    return []
  }, [column.key, column.properties?.choices, row])

  return (
    <div className="heygrid-cell-text flex items-center px-4">
      {value.map((choice, index) =>
        choice.image ? (
          <img
            className="mr-2 h-5 w-5 object-cover"
            key={index}
            src={choice.image!}
            width={40}
            height={40}
          />
        ) : (
          <IconPhoto key={index} />
        )
      )}
    </div>
  )
}
