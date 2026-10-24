import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { WorkspaceService } from '@/services'
import { useParam, useRouter } from '@/utils'
import { helper } from '@heyform-inc/utils'

import { Async, EmptyState, Repeat } from '@/components'
import { useAppStore, useWorkspaceStore } from '@/store'
import { FormType } from '@/types'

import FormItem from '../../project/Forms/FormItem'

export default function RecentForms() {
  const { t } = useTranslation()

  const router = useRouter()
  const { workspaceId } = useParam()
  const { openModal } = useAppStore()
  const { workspace } = useWorkspaceStore()

  const [data, setData] = useState<FormType[]>([])

  async function fetch() {
    const result = await WorkspaceService.recentForms(workspaceId)

    setData(result)
    return helper.isValid(result)
  }

  function handleCreateForm() {
    if (helper.isValidArray(workspace?.projects)) {
      router.push(`/workspace/${workspaceId}/project/${workspace.projects[0].id}/`, {
        state: {
          isCreateModalOpen: true
        }
      })
    } else {
      openModal('CreateProjectModal')
    }
  }

  return (
    <Async
      fetch={fetch}
      refreshDeps={[workspaceId]}
      loader={
        <div className="border-accent-light divide-accent-light mt-4 divide-y border-y">
          <Repeat count={3}>
            <FormItem.Skeleton />
          </Repeat>
        </div>
      }
      emptyRender={() => (
        <div className="mt-4">
          <EmptyState
            className="py-20 shadow-sm sm:py-36"
            headline={t('dashboard.noForms')}
            subHeadline={t('dashboard.pickTemplate')}
            buttonTitle={t('form.creation.title')}
            onClick={handleCreateForm}
          />
        </div>
      )}
    >
      <div className="border-accent-light divide-accent-light mt-4 divide-y border-y">
        {data.map(f => (
          <FormItem key={f.id} form={f} compact />
        ))}
      </div>
    </Async>
  )
}
