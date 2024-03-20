import clsx from 'clsx'
import { ReactNode, useCallback, useMemo, useState } from 'react'

import { IComponentProps, IMapType } from '../typing'

export interface TableColumn<T = any> {
  key: string
  name: string
  width?: number | string
  align?: 'left' | 'center' | 'right'
  scOnly?: boolean
  render?: (record: T, column: TableColumn<T>, isExpanded: boolean) => ReactNode
}

export interface TableProps<T> extends IComponentProps {
  columns: TableColumn<T>[]
  hideHead?: boolean
  data?: T[]
  multipleExpansion?: boolean
  expandedRender?: (record: T) => ReactNode
  onRowClick?: (record: T) => void
}

export interface TableTrProps<T> extends Omit<IComponentProps, 'onClick'> {
  columns: TableColumn<T>[]
  record: T
  expanded: string[]
  expandedRender?: (record: T) => ReactNode
  onClick?: (record: T) => void
}

function Tr<T extends IMapType>({
  columns,
  record,
  expanded,
  expandedRender,
  onClick,
  ...restProps
}: TableTrProps<T>) {
  const isExpanded = useMemo(() => expanded.includes(record.id), [expanded, record.id])

  const Expanded = useMemo(() => {
    if (isExpanded && expandedRender) {
      return expandedRender(record)
    }
  }, [isExpanded, expandedRender])

  function handleClick() {
    onClick?.(record)
  }

  return (
    <>
      <tr onClick={handleClick} {...restProps}>
        {columns.map(column => (
          <td
            key={column.key}
            className={clsx({
              [`table-cell-${column.align}`]: column.align
            })}
          >
            {column.render ? column.render(record, column, isExpanded) : record[column.key]}
          </td>
        ))}
      </tr>

      {Expanded}
    </>
  )
}

function Table<T extends IMapType>({
  className,
  columns,
  hideHead = false,
  data = [],
  multipleExpansion = false,
  expandedRender,
  onRowClick,
  ...restProps
}: TableProps<T>) {
  const [expanded, setExpanded] = useState<string[]>([])

  const handleRowClick = useCallback(
    (record: T) => {
      let newExpanded: string[]
      const isExpanded = expanded.includes(record.id)

      if (multipleExpansion) {
        newExpanded = isExpanded ? expanded.filter(e => e === record.id) : [...expanded, record.id]
      } else {
        newExpanded = isExpanded ? [] : [record.id]
      }

      setExpanded(newExpanded)
      onRowClick?.(record)
    },
    [expanded]
  )

  return (
    <div className={clsx('table-container', className)}>
      <table className="table" {...restProps}>
        <colgroup>
          {columns.map(column => (
            <col key={column.key} width={column.width} />
          ))}
        </colgroup>
        <thead className="table-head" style={{ display: hideHead ? 'none' : undefined }}>
          <tr>
            {columns.map(column => (
              <th
                key={column.key}
                className={clsx({
                  [`table-cell-${column.align}`]: column.align
                })}
              >
                <span
                  className={clsx({
                    'sr-only': column.scOnly
                  })}
                >
                  {column.name}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="table-body">
          {data.map(record => (
            <Tr
              key={record.id}
              record={record}
              columns={columns}
              expanded={expanded}
              expandedRender={expandedRender}
              onClick={handleRowClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table
