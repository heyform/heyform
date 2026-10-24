import { useRequest } from 'ahooks'
import { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { ProjectService } from '@/services'
import { useParam, useRouter } from '@/utils'

import { Avatar, Button, useToast } from '@/components'
import { useWorkspaceStore } from '@/store'
import { MemberType } from '@/types'

interface ProjectMemberItemProps {
  member: MemberType
}

export const ProjectMemberItem: FC<ProjectMemberItemProps & DOMProps> = ({ member, children }) => {
  const { t } = useTranslation()

  return (
    <div className="py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar
            className="flex-shrink-0"
            src={member.avatar}
            fallback={member.name}
            resize={{ width: 100, height: 100 }}
          />
          <div className="min-w-0 break-words text-sm">
            <div className="font-medium">
              <span>{member.name}</span>
              {member.isYou && (
                <span className="text-secondary ml-1 text-xs font-medium">
                  ({t('members.you')})
                </span>
              )}
              {member.isOwner && (
                <span className="text-secondary ml-1 text-xs font-medium">
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
      onError: (err: Error) => {
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

      toast({
        title: t('project.members.removeSuccess')
      })
    },
    {
      manual: true,
      refreshDeps: [workspaceId, projectId, member.id],
      onError: (err: Error) => {
        toast({
          title: t('project.members.removeFailed'),
          message: err.message
        })
      }
    }
  )

  const children = useMemo(() => {
    if (member.isOwner) {
      return null
    }

    if (member.isYou) {
      return (
        <Button
          className="shrink-0 rounded-lg"
          size="md"
          loading={leaveLoading}
          onClick={handleLeave}
        >
          {t('project.members.leave')}
        </Button>
      )
    }

    if (workspace?.isOwner) {
      return (
        <Button
          className="bg-error text-primary-light hover:bg-error dark:text-primary shrink-0 rounded-lg"
          size="md"
          loading={removeLoading}
          onClick={handleRemove}
        >
          {t('project.members.remove')}
        </Button>
      )
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

      toast({
        title: t('project.members.addSuccess')
      })
    },
    {
      manual: true,
      refreshDeps: [workspaceId, projectId, member.id],
      onError: (err: Error) => {
        toast({
          title: t('project.members.addFailed'),
          message: err.message
        })
      }
    }
  )

  return (
    <ProjectMemberItem member={member}>
      <Button.Ghost className="shrink-0 rounded-lg" size="md" loading={loading} onClick={run}>
        {t('project.members.add')}
      </Button.Ghost>
    </ProjectMemberItem>
  )
}
