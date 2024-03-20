import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Modal } from '@/components/ui'
import { WorkspaceService } from '@/service'
import { useStore } from '@/store'
import { useParam } from '@/utils'

export const LeaveWorkspace: FC<IModalProps> = ({ visible, onClose }) => {
  const navigate = useNavigate()
  const workspaceStore = useStore('workspaceStore')
  const { workspaceId } = useParam()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { t } = useTranslation()

  async function handleConfirm() {
    setLoading(true)
    setError(null)

    try {
      await WorkspaceService.leave(workspaceId)
      workspaceStore.deleteWorkspace(workspaceId)

      navigate('/', {
        replace: true
      })
    } catch (err: any) {
      setError(err)
    }

    setLoading(false)
  }

  return (
    <Modal.Confirm
      type="danger"
      visible={visible}
      title={t('workspace.members.leave')}
      description={
        <div className="space-y-2">
          <p>{t('workspace.members.leaveExplain')}</p>

          {error && <div className="form-item-error">{error.message}</div>}
        </div>
      }
      cancelLabel={t('project.trash.cancel')}
      confirmLabel={t('workspace.members.bottomLeave')}
      confirmDisabled={loading}
      confirmLoading={loading}
      onClose={onClose}
      onCancel={onClose}
      onConfirm={handleConfirm}
    />
  )
}
