import { helper } from '@heyform-inc/utils'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Async, EmptyState, Repeat } from '@/components'
import { WorkspaceService } from '@/services'
import { useAppStore, useWorkspaceStore } from '@/store'
import { FormType } from '@/types'
import { useParam, useRouter } from '@/utils'

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
        <div className="mt-4 divide-y divide-accent-light">
          <Repeat count={3}>
            <FormItem.Skeleton />
          </Repeat>
        </div>
      }
      emptyRender={() => (
        <div className="mt-4 flex flex-1 items-center justify-center rounded-lg border border-dashed border-accent-light py-36 shadow-sm">
          <EmptyState
            headline={t('dashboard.noForms')}
            subHeadline={t('dashboard.pickTemplate')}
            buttonTitle={t('form.creation.title')}
            onClick={handleCreateForm}
          />
        </div>
      )}
    >
      <div className="mt-4 divide-y divide-accent-light">
        {data.map(f => (
          <FormItem key={f.id} form={f} />
        ))}
      </div>
    </Async>
  )
}
