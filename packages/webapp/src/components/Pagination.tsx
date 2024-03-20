import type { FC } from 'react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui'

interface PaginationProps {
  className?: string
  total: number
  page: number
  pageSize: number
  onChange?: (page: number) => void
}

export const Pagination: FC<PaginationProps> = ({
  className,
  total,
  page = 1,
  pageSize = 20,
  onChange
}) => {
  const maxPage = useMemo(() => Math.ceil(total / pageSize), [total, pageSize])
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)

  function handlePrevious() {
    onChange?.(page - 1)
  }

  function handleNext() {
    onChange?.(page + 1)
  }

  useEffect(() => {
    setStart((page - 1) * pageSize + 1)
    setEnd(Math.min(total, page * pageSize))
  }, [page, pageSize, total])

  if (maxPage <= 1) {
    return null
  }

  return (
    <nav
      className={`flex items-center justify-between px-4 py-3 sm:px-6 ${className}`}
      aria-label="Pagination"
    >
      <div className="hidden sm:block">
        <p className="text-sm text-slate-900">
          Showing <span className="font-medium">{start}</span> to{' '}
          <span className="font-medium">{end}</span> of <span className="font-medium">{total}</span>{' '}
          results
        </p>
      </div>

      <div className="ml-5 flex flex-1 justify-between sm:justify-end">
        <Button disabled={page <= 1} onClick={handlePrevious}>
          Previous
        </Button>
        <Button className="ml-3" disabled={page >= maxPage} onClick={handleNext}>
          Next
        </Button>
      </div>
    </nav>
  )
}
