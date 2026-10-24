import { useEffect, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { WorkspaceService } from '@/services'
import { useParam } from '@/utils'

import { Async, Divider, Modal } from '@/components'
import { useModal, useUserStore, useWorkspaceStore } from '@/store'

import { ProjectJoinedMemberItem, ProjectRemainingMemberItem } from './ProjectMemberItem'

const ProjectMembers = () => {
  const { t } = useTranslation()

  const { workspaceId } = useParam()
  const { workspace, project, members, setMembers } = useWorkspaceStore()

  async function fetch() {
    setMembers(workspaceId, await WorkspaceService.members(workspaceId))
    return true
  }
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
    <Async fetch={fetch} refreshDeps={[workspaceId, project?.id]}>
      <div className="divide-accent-light divide-y">
        {joined.map(m => (
          <ProjectJoinedMemberItem key={m.id} member={m} />
        ))}
      </div>

      {remaining.length > 0 && (
        <div className="mt-4 opacity-70 transition-colors duration-150 hover:opacity-100">
          <Divider>{t('project.members.unjoinedMembers')}</Divider>

          <div className="divide-accent-light divide-y">
            {remaining.map(m => (
              <ProjectRemainingMemberItem key={m.id} member={m} />
            ))}
          </div>
        </div>
      )}
    </Async>
  )
}

export default function ProjectMembersModal() {
  const { t } = useTranslation()
  const { isOpen, onOpenChange, close } = useModal('ProjectMembersModal')
  const { projectId } = useParam()

  useEffect(() => () => close(), [projectId, close])

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
