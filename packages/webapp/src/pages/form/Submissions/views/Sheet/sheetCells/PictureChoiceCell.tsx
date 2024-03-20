import { IconPhoto } from '@tabler/icons-react'
import { FC } from 'react'

import { SheetCellProps } from '../types'

export const PictureChoiceCell: FC<SheetCellProps> = ({ column, row }) => {
  const value = row[column.key]?.value
  const choices = column.properties?.choices?.filter(choice => value?.includes(choice.id))

  return (
    <div className="heygrid-cell-text flex items-center px-4">
      {choices?.map((choice, index) =>
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
