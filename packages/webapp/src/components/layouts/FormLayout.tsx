import { FC } from 'react'

import { FormNavbar } from '@/pages/form/views/FormNavbar'
import { FormPreviewModal } from '@/pages/form/views/FormPreviewModal'
import { FormShareModal } from '@/pages/form/views/FormShareModal'

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
