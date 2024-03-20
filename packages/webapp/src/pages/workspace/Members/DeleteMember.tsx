import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Modal } from '@/components/ui'
import type { UserModel } from '@/models'
import { WorkspaceService } from '@/service'
import { useStore } from '@/store'
import { useParam } from '@/utils'

interface DeleteMemberProps extends IModalProps {
  member?: UserModel | null
}

export const DeleteMember: FC<DeleteMemberProps> = ({ visible, member, onClose }) => {
  const workspaceStore = useStore('workspaceStore')
  const { workspaceId } = useParam()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { t } = useTranslation()

  async function handleConfirm() {
    setLoading(true)
    setError(null)

    try {
      await WorkspaceService.removeMember(workspaceId, member!.id)
      workspaceStore.deleteMember(workspaceId, member!.id)

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
      title={t('workspace.members.delConfirm')}
      description={
        <div className="space-y-2">
          <p>{t('workspace.members.delMember')}</p>
          {error && <div className="form-item-error">{error.message}</div>}
        </div>
      }
      cancelLabel={t('project.trash.cancel')}
      confirmLabel={t('workspace.members.remove')}
      confirmDisabled={loading}
      confirmLoading={loading}
      onClose={onClose}
      onCancel={onClose}
      onConfirm={handleConfirm}
    />
  )
}
