import { FC } from 'react'

import { FormPreviewModal } from '@/components'

import { FormShareModal } from '../FormShareModal'
import { FormNavbar } from '../formNavbar'
import { FormGuardLayout } from './FormGuardLayout'

export const FormLayout: FC<IComponentProps> = ({ children }) => {
  return (
    <FormGuardLayout>
      <div className="flex h-screen flex-col text-sm print:h-auto">
        <FormNavbar />
        <div className="content flex-1 bg-slate-50">{children}</div>
      </div>

      <FormPreviewModal />
      <FormShareModal />
    </FormGuardLayout>
  )
}
