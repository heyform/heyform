import { useRequest } from 'ahooks'
import { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar, Button, useToast } from '@/components'
import { ProjectService } from '@/services'
import { useWorkspaceStore } from '@/store'
import { MemberType } from '@/types'
import { useParam, useRouter } from '@/utils'

interface ProjectMemberItemProps {
  member: MemberType
}

export const ProjectMemberItem: FC<ProjectMemberItemProps & DOMProps> = ({ member, children }) => {
  const { t } = useTranslation()

  return (
    <div className="py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            className="flex-shrink-0"
            src={member.avatar}
            fallback={member.name}
            resize={{ width: 100, height: 100 }}
          />
          <div className="text-sm">
            <div className="font-medium">
              <span>{member.name}</span>
              {member.isYou && (
                <span className="ml-1 text-xs font-medium text-secondary">
                  ({t('members.you')})
                </span>
              )}
              {member.isOwner && (
                <span className="ml-1 text-xs font-medium text-secondary">
                  ({t('members.owner')})
                </span>
              )}
            </div>
            <div className="text-secondary">{member.email}</div>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}

export const ProjectJoinedMemberItem: FC<ProjectMemberItemProps> = ({ member }) => {
  const { t } = useTranslation()

  const toast = useToast()
  const router = useRouter()

  const { workspaceId, projectId } = useParam()
  const { workspace, deleteProject, removeMemberFromProject } = useWorkspaceStore()

  const { loading: leaveLoading, run: handleLeave } = useRequest(
    async () => {
      await ProjectService.leave(projectId)
      deleteProject(workspaceId, projectId)

      toast({
        title: t('project.members.leaveSuccess')
      })

      router.replace(`/workspace/${workspaceId}`)
    },
    {
      manual: true,
      refreshDeps: [workspaceId, projectId],
      onError: (err: any) => {
        toast({
          title: t('project.members.leaveFailed'),
          message: err.message
        })
      }
    }
  )

  const { loading: removeLoading, run: handleRemove } = useRequest(
    async () => {
      await ProjectService.removeMember(projectId, member.id)
      removeMemberFromProject(workspaceId, projectId, member.id)
    },
    {
      manual: true,
      refreshDeps: [workspaceId, projectId, member.id],
      onError: (err: any) => {
        toast({
          title: t('project.members.removeFailed'),
          message: err.message
        })
      }
    }
  )

  const children = useMemo(() => {
    if (!member.isOwner && !member.isYou) {
      if (member.isYou) {
        return (
          <Button size="md" loading={leaveLoading} onClick={handleLeave}>
            {t('project.members.leave')}
          </Button>
        )
      } else if (workspace?.isOwner) {
        return (
          <Button
            className="bg-error text-primary-light hover:bg-error dark:text-primary"
            size="md"
            loading={removeLoading}
            onClick={handleRemove}
          >
            {t('project.members.remove')}
          </Button>
        )
      }
    }

    return null
  }, [
    handleLeave,
    handleRemove,
    leaveLoading,
    member.isOwner,
    member.isYou,
    removeLoading,
    t,
    workspace?.isOwner
  ])

  return <ProjectMemberItem member={member}>{children}</ProjectMemberItem>
}

export const ProjectRemainingMemberItem: FC<ProjectMemberItemProps> = ({ member }) => {
  const { t } = useTranslation()

  const toast = useToast()

  const { workspaceId, projectId } = useParam()
  const { addMemberToProject } = useWorkspaceStore()

  const { loading, run } = useRequest(
    async () => {
      await ProjectService.addMember(projectId, member.id)
      addMemberToProject(workspaceId, projectId, member.id)
    },
    {
      manual: true,
      refreshDeps: [workspaceId, projectId, member.id],
      onError: (err: any) => {
        toast({
          title: t('project.members.addFailed'),
          message: err.message
        })
      }
    }
  )

  return (
    <ProjectMemberItem member={member}>
      <Button.Ghost size="md" loading={loading} onClick={run}>
        {t('project.members.add')}
      </Button.Ghost>
    </ProjectMemberItem>
  )
}
