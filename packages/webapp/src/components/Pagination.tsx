import type { FC } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/utils'

import { Button, ButtonProps } from './Button'

interface PaginationProps extends Omit<ComponentProps, 'onChange'> {
  total: number
  page: number
  pageSize: number
  loading?: boolean
  buttonProps?: ButtonProps
  onChange?: (page: number) => void
}

export const Pagination: FC<PaginationProps> = ({
  className,
  total,
  page = 1,
  pageSize = 10,
  loading,
  buttonProps,
  onChange
}) => {
  const { t } = useTranslation()

  const maxPage = useMemo(() => Math.ceil(total / pageSize), [total, pageSize])

  function handlePrevious() {
    onChange?.(page - 1)
  }

  function handleNext() {
    onChange?.(page + 1)
  }

  if (maxPage <= 1) {
    return null
  }

  return (
    <nav
      className={cn('flex items-center justify-between gap-x-4', className)}
      role="navigation"
      aria-label="pagination"
    >
      <div className="hidden text-sm/6 text-primary sm:block" data-slot="info">
        {t('components.pagination.title', { page, maxPage })}
      </div>

      <div className="flex flex-1 justify-between gap-x-3 sm:justify-end" data-slot="buttons">
        <Button.Ghost
          size="md"
          {...buttonProps}
          data-slot="previous"
          disabled={page <= 1 || loading}
          onClick={handlePrevious}
        >
          {t('components.pagination.previous')}
        </Button.Ghost>
        <Button.Ghost
          size="md"
          {...buttonProps}
          data-slot="next"
          disabled={page >= maxPage || loading}
          onClick={handleNext}
        >
          {t('components.pagination.next')}
        </Button.Ghost>
      </div>
    </nav>
  )
}
