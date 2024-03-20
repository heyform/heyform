import { observer } from 'mobx-react-lite'
import type { FC } from 'react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Avatar, Badge, Button, Modal, notification } from '@/components/ui'
import type { UserModel } from '@/models'
import { ProjectService } from '@/service'
import { useStore } from '@/store'
import { useParam } from '@/utils'

interface MemberItemProps {
  member: UserModel
  disabled?: boolean
}

export const MemberItem: FC<MemberItemProps> = ({ member, disabled }) => {
  const navigate = useNavigate()
  const { workspaceId, projectId } = useParam()
  const workspaceStore = useStore('workspaceStore')
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()

  async function handleRemove() {
    try {
      await ProjectService.deleteMember(projectId, member.id)
      workspaceStore.deleteProjectMember(workspaceId, projectId, member.id)
    } catch (err: any) {
      notification.error({
        title: t('project.ProjectMembers.removeMember'),
        message: err.message
      })
    }
  }

  async function handleAdd() {
    try {
      await ProjectService.addMember(projectId, member.id)
      workspaceStore.addProjectMember(workspaceId, projectId, member.id)
    } catch (err: any) {
      notification.error({
        title: t('project.ProjectMembers.assignMember'),
        message: err.message
      })
    }
  }

  async function handleLeave() {
    try {
      await ProjectService.leave(projectId)
      workspaceStore.deleteProject(workspaceId, projectId)

      notification.success({
        title: t('project.ProjectMembers.leftP')
      })

      navigate(`/workspace/${workspaceId}`, {
        replace: true
      })
    } catch (err: any) {
      notification.error({
        title: t('project.ProjectMembers.leaveP'),
        message: err.message
      })
    }
  }

  async function handleClick() {
    setLoading(true)

    if (member.isAssigned) {
      if (member.isSelf) {
        await handleLeave()
      } else {
        await handleRemove()
      }
    } else {
      await handleAdd()
    }

    setLoading(false)
  }

  return (
    <div className="group flex items-center py-2.5 text-sm text-slate-700">
      <Avatar
        className="h-10 w-10"
        src={member.avatar}
        size={80}
        retainLength={2}
        rounded
        circular
      />

      <div className="ml-4 flex-auto">
        <p className="truncate text-sm font-medium text-slate-700">
          {member.name}
          {member.isSelf && t('project.ProjectMembers.you')}
          {member.isOwner && (
            <Badge className="ml-1" type="blue" text={t('workspace.members.index.owner')} />
          )}
        </p>
        <p className="truncate text-sm text-slate-500">{member.email}</p>
      </div>

      {!(member.isSelf && member.isOwner) && (
        <Button
          className="px-2.5 py-0.5"
          rounded
          loading={loading}
          disabled={loading || disabled}
          onClick={handleClick}
        >
          {member.isAssigned
            ? member.isSelf
              ? t('project.ProjectMembers.leave')
              : t('project.ProjectMembers.remove')
            : t('project.ProjectMembers.assign')}
        </Button>
      )}
    </div>
  )
}

export const ProjectMembers: FC<IModalProps> = observer(({ visible, onClose }) => {
  const workspaceStore = useStore('workspaceStore')
  const userStore = useStore('userStore')
  const { t } = useTranslation()

  const assignedMembers = useMemo(() => {
    return workspaceStore.members
      .filter(m => workspaceStore.project?.members.includes(m.id))
      .map(m => ({
        ...m,
        isAssigned: true,
        isOwner: workspaceStore.workspace.ownerId === m.id,
        isSelf: userStore.user.id === m.id
      }))
  }, [workspaceStore.project?.members, workspaceStore.members])

  const unassignedMembers = useMemo(() => {
    return workspaceStore.members.filter(m => !workspaceStore.project?.members.includes(m.id))
  }, [workspaceStore.project?.members, workspaceStore.members])

  return (
    <Modal visible={visible} onClose={onClose} showCloseIcon>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-medium leading-6 text-slate-900">
            {t('project.ProjectMembers.members')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t('project.ProjectMembers.explain')}</p>
        </div>

        <div>
          <div className="block text-sm font-medium text-slate-700">
            {t('project.ProjectMembers.assigned')}
          </div>
          <div>
            {assignedMembers.map(row => (
              <MemberItem key={row.id} member={row} />
            ))}
          </div>
        </div>

        {unassignedMembers.length > 0 && (
          <div className="opacity-70">
            <div className="block text-sm font-medium text-slate-700">
              {t('project.ProjectMembers.notAssigned')}
            </div>
            <div>
              {unassignedMembers.map(row => (
                <MemberItem key={row.id} member={row} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
})
