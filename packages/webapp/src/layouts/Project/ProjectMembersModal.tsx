import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Divider, Modal } from '@/components'
import { useModal, useUserStore, useWorkspaceStore } from '@/store'

import { ProjectJoinedMemberItem, ProjectRemainingMemberItem } from './ProjectMemberItem'

const ProjectMembers = () => {
  const { t } = useTranslation()

  const { workspace, project, members } = useWorkspaceStore()
  const { user } = useUserStore()

  const joined = useMemo(() => {
    return members
      .filter(m => project?.members.includes(m.id))
      .map(m => ({
        ...m,
        isOwner: workspace.ownerId === m.id,
        isYou: user.id === m.id
      }))
  }, [members, project?.members, user.id, workspace.ownerId])

  const remaining = useMemo(
    () => members.filter(m => !project?.members.includes(m.id)),
    [members, project?.members]
  )

  return (
    <>
      <div className="divide-y divide-accent-light">
        {joined.map(m => (
          <ProjectJoinedMemberItem key={m.id} member={m} />
        ))}
      </div>

      {remaining.length > 0 && (
        <div className="mt-4 opacity-70 transition-colors duration-150 hover:opacity-100">
          <Divider>{t('project.members.unjoinedMembers')}</Divider>

          <div className="divide-y divide-accent-light">
            {remaining.map(m => (
              <ProjectRemainingMemberItem key={m.id} member={m} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default function ProjectMembersModal() {
  const { t } = useTranslation()
  const { isOpen, onOpenChange } = useModal('ProjectMembersModal')

  return (
    <Modal.Simple
      open={isOpen}
      title={t('project.members.headline')}
      description={
        <Trans
          t={t}
          i18nKey="project.members.subHeadline"
          components={{
            strong: <strong />
          }}
        />
      }
      onOpenChange={onOpenChange}
    >
      <ProjectMembers />
    </Modal.Simple>
  )
}
