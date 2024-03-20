import { observer } from 'mobx-react-lite'
import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PhotoPickerField, WorkspaceIcon } from '@/components'
import { WorkspaceService } from '@/service'
import { useStore } from '@/store'
import { useParam } from '@/utils'

export const LogoUploader: FC = observer(() => {
  const { workspaceId } = useParam()
  const workspaceStore = useStore('workspaceStore')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { t } = useTranslation()

  async function handleChange(avatar: string) {
    setLoading(true)
    setError(null)

    try {
      await WorkspaceService.update({
        teamId: workspaceId,
        avatar
      })

      workspaceStore.updateWorkspace(workspaceId, {
        avatar
      })
    } catch (err: any) {
      setError(err)
    }

    setLoading(false)
  }

  return (
    <div>
      <PhotoPickerField
        value={workspaceStore.workspace?.avatar}
        label={t('workspace.settings.logo')}
        description={t('workspace.settings.pickLogo')}
        defaultIcon={<WorkspaceIcon />}
        changeLoading={loading}
        onChange={handleChange}
      />

      {error && <div className="form-item-error">{error.message}</div>}
    </div>
  )
})
