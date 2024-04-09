import { helper } from '@heyform-inc/utils'
import { IconPaperclip } from '@tabler/icons-react'
import { FC, useMemo } from 'react'

import { getFileUploadValue, urlBuilder } from '@/utils'

import { SheetCellProps } from '../types'

export const FileUploadCell: FC<SheetCellProps> = ({ column, row }) => {
  const value = useMemo(() => getFileUploadValue(row[column.key]), [column.key, row])

  if (helper.isEmpty(value)) {
    return <div className="heygrid-cell-text flex" />
  }

  return (
    <div className="heygrid-cell-text flex items-center overflow-hidden text-ellipsis whitespace-nowrap">
      <a className="inline-flex" href={value!.url} target="_blank" rel="noreferrer">
        <IconPaperclip className="mt-[10px] h-5 w-5 text-[#8a94a6]" />
        <div className="ml-1 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {value!.filename}
        </div>
      </a>
    </div>
  )
}
