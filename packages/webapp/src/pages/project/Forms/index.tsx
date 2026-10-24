import { FormStatusEnum } from '@heyform-inc/shared-types-enums'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FormService } from '@/services'
import { useParam } from '@/utils'
import { helper } from '@heyform-inc/utils'

import { Async, EmptyState, Repeat } from '@/components'
import { useAppStore } from '@/store'
import { FormType } from '@/types'

import FormItem from './FormItem'

export default function ProjectForms() {
  const { t } = useTranslation()

  const { projectId } = useParam()
  const { openModal } = useAppStore()
  const [forms, setForms] = useState<FormType[]>([])

  async function fetch() {
    const result = await FormService.forms(projectId, FormStatusEnum.NORMAL)

    setForms(result)
    return helper.isValid(result)
  }

  function handleChange(type: string, form: FormType) {
    switch (type) {
      case 'rename':
        setForms(f => f.map(row => (row.id === form.id ? form : row)))
        break

      case 'trash':
        setForms(f => f.filter(row => row.id !== form.id))
        break
    }
  }

  return (
    <Async
      fetch={fetch}
      refreshDeps={[projectId]}
      loader={
        <div className="divide-accent-light divide-y">
          <Repeat count={3}>
            <FormItem.Skeleton />
          </Repeat>
        </div>
      }
      emptyRender={() => (
        <div className="mt-4">
          <EmptyState
            headline={t('project.forms.headline')}
            subHeadline={t('dashboard.pickTemplate')}
            buttonTitle={t('form.creation.title')}
            onClick={() => openModal('CreateFormModal')}
          />
        </div>
      )}
    >
      <div className="divide-accent-light divide-y">
        {forms.map(f => (
          <FormItem key={f.id} form={f} compact onChange={handleChange} />
        ))}
      </div>
    </Async>
  )
}
