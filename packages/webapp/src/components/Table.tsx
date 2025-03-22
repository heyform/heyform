import { useBoolean, usePagination } from 'ahooks'
import {
  ReactNode,
  Ref,
  TableHTMLAttributes,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState
} from 'react'

import { cn } from '@/utils'

import { AsyncProps } from './Async'
import { Checkbox } from './Checkbox'
import { Pagination } from './Pagination'

export interface TableColumn<T, K> {
  field: T
  headerRender: (field: T, index: number) => ReactNode
  cellRender: (field: T, record: K, index: number) => ReactNode
}

export interface TableFetchParams {
  current: number
  pageSize: number
}

export interface TableRef<K> {
  toNext: () => void
  toPrevious: () => void
  unexpand: () => void
  refresh: () => Promise<{ total: number; list: K[] }>
}

export interface TableState {
  isNextDisabled: boolean
  isPreviousDisabled: boolean
  loading: boolean
}

interface TableProps<T, K>
  extends Omit<AsyncProps, 'fetch' | 'children'>,
    TableHTMLAttributes<HTMLTableElement> {
  ref?: Ref<TableRef<K>>
  classNames?: {
    tablePanel?: string
    container?: string
    table?: string
    footer?: string
    pagination?: string
    detailPanel?: string
  }
  rowKey?: string
  isSelectable?: boolean
  selectedRowKeys?: string[]
  columns: TableColumn<T, K>[]
  defaultPage?: number
  defaultPageSize?: number
  fetch: (params: TableFetchParams) => Promise<{ total: number; list: any[] }>
  onExpandedChange?: (record: K, state: TableState) => void
  onSelectionChange?: (selectedRowKeys: string[]) => void
}

interface TrProps<T, K> {
  index: number
  record: K & { _key: string }
  columns: Array<TableColumn<T, K> & { _key: string }>
  isSelected?: boolean
  onClick: (index: number) => void
  onSelect: (checked: boolean, key: string) => void
}

function Tr<T, K>({ index, record, columns, isSelected, onSelect, onClick }: TrProps<T, K>) {
  function handleSelect(checked: boolean) {
    onSelect(checked, record._key)
  }

  function handleClick() {
    onClick(index)
  }

  return (
    <tr
      className="cursor-pointer border-b border-accent hover:bg-primary/[2.5%] data-[selected]:bg-primary/[2.5%] [&:hover_[data-slot=expand]]:opacity-100"
      data-selected={isSelected ? '' : undefined}
      onClick={handleClick}
    >
      <td data-slot="select-row" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-x-1">
          <Checkbox value={isSelected} onChange={handleSelect} />
        </div>
      </td>

      {columns.map((col, index) => (
        <td key={col._key}>{col.cellRender(col.field, record, index)}</td>
      ))}
    </tr>
  )
}

export function Table<T, K>({
  ref,
  className,
  classNames,
  rowKey = 'id',
  isSelectable = true,
  selectedRowKeys = [],
  columns: rawColumns,
  defaultPage: defaultCurrent = 1,
  defaultPageSize = 20,
  refreshDeps = [],
  fetch,
  loader,
  emptyRender,
  errorRender,
  onSelectionChange,
  onExpandedChange
}: TableProps<T, K>) {
  const [expandedIndex, setExpandedIndex] = useState<number>(-1)
  const [isRefreshing, { setTrue, setFalse }] = useBoolean(false)

  const columns = useMemo(
    () =>
      rawColumns.map(c => ({
        _key: (c.field as AnyMap)[rowKey],
        ...c
      })),
    [rawColumns, rowKey]
  )

  const { data, loading, error, pagination, runAsync, params } = usePagination(fetch, {
    defaultCurrent,
    defaultPageSize,
    refreshDeps,
    staleTime: 0,
    cacheTime: 0,
    onSuccess: setFalse,
    onError: setFalse
  })

  const refresh = useCallback(async () => {
    setTrue()
    return runAsync(params as Any)
  }, [params, runAsync, setTrue])

  const list = useMemo(
    () =>
      (data?.list || []).map(r => ({
        _key: r[rowKey],
        ...r
      })),
    [data?.list, rowKey]
  )

  const toPrevious = useCallback(() => {
    let index: number

    if (expandedIndex <= 0) {
      pagination.changeCurrent(pagination.current - 1)
      index = 0
    } else {
      index = expandedIndex - 1
    }

    setExpandedIndex(index)
  }, [expandedIndex, pagination])

  const toNext = useCallback(() => {
    let index: number

    if (expandedIndex >= list.length - 1) {
      pagination.changeCurrent(pagination.current + 1)
      index = list.length - 1
    } else {
      index = expandedIndex + 1
    }

    setExpandedIndex(index)
  }, [expandedIndex, list, pagination])

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      onSelectionChange?.(selected ? (data?.list || []).map(row => (row as AnyMap)[rowKey]) : [])
    },
    [data?.list, onSelectionChange, rowKey]
  )

  const handleSelectRow = useCallback(
    (checked: boolean, key: string) => {
      onSelectionChange?.(
        checked ? [...selectedRowKeys, key] : selectedRowKeys.filter(v => v !== key)
      )
    },
    [onSelectionChange, selectedRowKeys]
  )

  const Thead = useMemo(() => {
    return (
      <tr>
        {isSelectable && (
          <th data-slot="select-all" style={{ width: 40 }}>
            <div className="flex items-center">
              <Checkbox
                value={selectedRowKeys?.length === data?.list.length && data?.list.length > 0}
                onChange={handleSelectAll}
              />
            </div>
          </th>
        )}

        {columns.map((col, index) => (
          <th key={(col.field as AnyMap)[rowKey]}>{col.headerRender(col.field, index)}</th>
        ))}
      </tr>
    )
  }, [columns, data?.list.length, handleSelectAll, isSelectable, rowKey, selectedRowKeys?.length])

  const TBody = useMemo(
    () =>
      list.map((record, index) => (
        <Tr<T, K>
          key={record._key}
          index={index}
          record={record}
          columns={columns}
          isSelected={selectedRowKeys?.includes(record._key)}
          onSelect={handleSelectRow}
          onClick={setExpandedIndex}
        />
      )),
    [list, columns, selectedRowKeys, handleSelectRow]
  )

  const Table = useMemo(() => {
    if (!(isRefreshing && pagination.total > 0) && loading) {
      return loader
    } else if (error) {
      return errorRender?.(error)
    } else {
      if (pagination.total < 1) {
        return emptyRender?.({ refresh })
      } else {
        return (
          <table className={classNames?.table}>
            <thead className="border-b border-accent">{Thead}</thead>
            <tbody>{TBody}</tbody>
          </table>
        )
      }
    }
  }, [
    TBody,
    Thead,
    classNames?.table,
    emptyRender,
    error,
    errorRender,
    isRefreshing,
    loader,
    loading,
    pagination.total,
    refresh
  ])

  const Footer = useMemo(() => {
    if (pagination.total <= defaultPageSize) {
      return null
    }

    return (
      <div className={cn('mt-4 flex items-center', classNames?.footer)}>
        <Pagination
          className={cn('[&_[data-slot=info]]:text-secondary', classNames?.pagination)}
          total={pagination.total}
          page={pagination.current}
          pageSize={defaultPageSize}
          buttonProps={{
            size: 'sm'
          }}
          loading={loading}
          onChange={pagination.changeCurrent}
        />
      </div>
    )
  }, [classNames?.footer, classNames?.pagination, defaultPageSize, loading, pagination])

  useImperativeHandle<TableRef<K>, TableRef<K>>(
    ref,
    () => ({
      refresh,
      toPrevious,
      toNext,
      unexpand: () => setExpandedIndex(-1)
    }),
    [refresh, toNext, toPrevious]
  )

  useEffect(() => {
    if (onExpandedChange && expandedIndex > -1) {
      onExpandedChange?.(list[expandedIndex], {
        isPreviousDisabled: pagination.current <= 1 && expandedIndex === 0,
        isNextDisabled: pagination.current >= pagination.total && expandedIndex === list.length - 1,
        loading: !isRefreshing && loading
      })
    }
  }, [
    onExpandedChange,
    expandedIndex,
    isRefreshing,
    list,
    loading,
    pagination.current,
    pagination.total
  ])

  return (
    <div className={className}>
      <div className={classNames?.container}>{Table}</div>
      {Footer}
    </div>
  )
}
