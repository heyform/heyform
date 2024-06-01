import type { Column, InputTableValue } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import type { FC } from 'react'
import { startTransition, useMemo, useState } from 'react'

import { Input } from '../components'
import { IComponentProps } from '../typings'

interface InputFieldProps {
  value?: string
  rowIdx: number
  columnId: string
  onChange?: (rowIdx: number, columnId: string, value: string) => void
}

interface TableInputProps extends Omit<IComponentProps, 'onChange' | 'value'> {
  value?: InputTableValue
  columns?: Column[]
  onChange?: (value: Array<Record<string, string>>) => void
}

const InputField: FC<InputFieldProps> = ({ rowIdx, columnId, value, onChange }) => {
  function handleChange(newValue: any) {
    startTransition(() => {
      onChange?.(rowIdx, columnId, newValue)
    })
  }

  return (
    <td>
      <Input type="text" value={value} onChange={handleChange} />
    </td>
  )
}

function getInputFieldValue(column: Column, rowIdx: number, value?: InputTableValue) {
  if (value && value[rowIdx]) {
    return value[rowIdx][column.id]
  }
}

export const TableInput: FC<TableInputProps> = ({
  value = [],
  columns,
  onChange,
  ...restProps
}) => {
  const [rowLength, setRowLength] = useState(Math.max(value?.length || 0, 5))
  const rows = useMemo(() => Array.from({ length: rowLength }), [rowLength])

  function handleChange(rowIdx: number, columnId: string, newValue: string) {
    const valueCopy = value

    if (helper.isEmpty(valueCopy[rowIdx])) {
      valueCopy[rowIdx] = {}
    }

    valueCopy[rowIdx][columnId] = newValue
    onChange?.(valueCopy)

    if (helper.isValid(newValue) && rowIdx === rowLength - 1) {
      setRowLength(rowLength + 1)
    }
  }

  return (
    <div className="heyform-table-root" {...restProps}>
      <table>
        <thead className="heyform-table-header">
          <tr>
            {columns?.map(column => (
              <th key={column.id}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((_, rowIdx) => (
            <tr key={rowIdx} className="heyform-table-row">
              {columns?.map(column => (
                <InputField
                  key={column.id}
                  value={getInputFieldValue(column, rowIdx, value)}
                  columnId={column.id}
                  rowIdx={rowIdx}
                  onChange={handleChange}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
