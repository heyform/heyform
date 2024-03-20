import type { FC } from 'react'

import { AuthGuard, CommonLayout } from '@/components'

export const AuthLayout: FC<IComponentProps> = ({ children }) => {
  return (
    <AuthGuard>
      <CommonLayout>{children}</CommonLayout>
    </AuthGuard>
  )
}
