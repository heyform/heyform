import { FC } from 'react'

import { cn } from '@/utils'

interface SkeletonProps extends ComponentProps {
  loading?: boolean
}

export const Skeleton: FC<SkeletonProps> = ({ className, loading, children }) => {
  if (loading) {
    return (
      <div className={cn('flex h-6 items-center', className)}>
        <div className="skeleton h-3.5 rounded-md" data-slot="skeleton" />
      </div>
    )
  }

  return children
}
