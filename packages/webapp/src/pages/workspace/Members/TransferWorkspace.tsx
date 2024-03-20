import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Modal } from '@/components/ui'
import type { UserModel } from '@/models'
import { WorkspaceService } from '@/service'
import { useStore } from '@/store'
import { useParam } from '@/utils'

interface TransferWorkspaceProps extends IModalProps {
  member?: UserModel | null
}

export const TransferWorkspace: FC<TransferWorkspaceProps> = ({ visible, member, onClose }) => {
  const workspaceStore = useStore('workspaceStore')
  const { workspaceId } = useParam()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { t } = useTranslation()

  async function handleConfirm() {
    setLoading(true)
    setError(null)

    try {
      await WorkspaceService.transfer(workspaceId, member!.id)

      const [res1, res2] = await Promise.all([
        WorkspaceService.workspaces(),
        WorkspaceService.members(workspaceId)
      ])

      workspaceStore.setWorkspaces(res1)
      workspaceStore.setMembers(workspaceId, res2)

      // Hide modal
      onClose?.()
    } catch (err: any) {
      setError(err)
    }

    setLoading(false)
  }

  return (
    <Modal.Confirm
      type="danger"
      visible={visible}
      title={t('workspace.members.transferTitle')}
      description={
        <div className="space-y-2">
          <p>{t('workspace.members.transferWorkspace')}</p>

          {error && <div className="form-item-error">{error.message}</div>}
        </div>
      }
      cancelLabel={t('project.trash.cancel')}
      confirmLabel={t('workspace.members.transfer')}
      confirmDisabled={loading}
      confirmLoading={loading}
      onClose={onClose}
      onCancel={onClose}
      onConfirm={handleConfirm}
    />
  )
}
