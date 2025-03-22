import { IconDots } from '@tabler/icons-react'
import { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar, Button, Dropdown, Tooltip, useAlert } from '@/components'
import { WorkspaceService } from '@/services'
import { useUserStore, useWorkspaceStore } from '@/store'
import { MemberType } from '@/types'
import { timeFromNow } from '@/utils'

const MemberItem: FC<{ member: MemberType }> = ({ member }) => {
  const { t, i18n } = useTranslation()

  const alert = useAlert()
  const { workspace, setWorkspaces, setMembers, removeMember, deleteWorkspace } =
    useWorkspaceStore()
  const { user } = useUserStore()

  const isYou = useMemo(() => member.id === user.id, [member.id, user.id])

  const Action = useMemo(() => {
    if (workspace?.isOwner) {
      if (isYou) {
        return null
      }
    } else {
      if (!isYou) {
        return null
      }
    }

    let options = [
      {
        label: 'members.leave.title',
        value: 'leave'
      }
    ]

    if (workspace?.isOwner) {
      options = [
        {
          label: 'members.transfer.title',
          value: 'transfer'
        },
        {
          label: 'members.remove.title',
          value: 'remove'
        }
      ]
    }

    function handleTransfer() {
      alert({
        title: t('members.transfer.headline', { name: member.name }),
        description: t('members.transfer.subHeadline'),
        cancelProps: {
          label: t('components.cancel')
        },
        confirmProps: {
          label: t('members.transfer.confirm'),
          className: 'bg-error hover:bg-error text-primary-light dark:text-primary'
        },
        fetch: async () => {
          await WorkspaceService.transfer(workspace.id, member.id)

          const [res1, res2] = await Promise.all([
            WorkspaceService.workspaces(),
            WorkspaceService.members(workspace.id)
          ])

          setWorkspaces(res1)
          setMembers(workspace.id, res2)
        }
      })
    }

    function handleLeave() {
      alert({
        title: t('members.leave.headline'),
        description: t('members.leave.subHeadline'),
        cancelProps: {
          label: t('components.cancel')
        },
        confirmProps: {
          label: t('members.leave.confirm'),
          className: 'bg-error hover:bg-error text-primary-light dark:text-primary'
        },
        fetch: async () => {
          await WorkspaceService.leave(workspace.id)
          deleteWorkspace(workspace.id)
        }
      })
    }

    function handleRemove() {
      alert({
        title: t('members.remove.headline', { name: member.name }),
        description: t('members.remove.subHeadline'),
        cancelProps: {
          label: t('components.cancel')
        },
        confirmProps: {
          label: t('members.remove.confirm'),
          className: 'bg-error hover:bg-error text-primary-light dark:text-primary'
        },
        fetch: async () => {
          await WorkspaceService.removeMember(workspace.id, member.id)
          removeMember(workspace.id, member.id)
        }
      })
    }

    function handleClick(value: string) {
      switch (value) {
        case 'transfer':
          return handleTransfer()

        case 'leave':
          return handleLeave()

        case 'remove':
          return handleRemove()
      }
    }

    return (
      <Dropdown
        contentProps={{
          className: '[&_[data-value=remove]]:text-error',
          sideOffset: 8
        }}
        options={options}
        multiLanguage
        onClick={handleClick}
      >
        <Button.Link className="data-[state=open]:bg-accent-light" size="sm" iconOnly>
          <Tooltip label={t('members.menuTip')}>
            <IconDots className="h-5 w-5 text-secondary" />
          </Tooltip>
        </Button.Link>
      </Dropdown>
    )
  }, [workspace?.isOwner, t, isYou])

  return (
    <tr className="hover:bg-primary/[2.5%]">
      <td className="border-b border-accent p-4 sm:first:pl-1 sm:last:pr-1">
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
              {member.id === user.id && (
                <span className="ml-1 font-normal text-secondary">({t('members.you')})</span>
              )}
            </div>
            <div className="text-secondary">{member.email}</div>
          </div>
        </div>
      </td>

      <td className="border-b border-accent p-4 sm:first:pl-1 sm:last:pr-1">
        {member.isOwner ? t('members.owner') : t('members.member')}
      </td>

      <td className="border-b border-accent p-4 sm:first:pl-1 sm:last:pr-1">
        {member.lastSeenAt ? timeFromNow(member.lastSeenAt, i18n.language) : ''}
      </td>

      <td className="border-b border-accent p-4 sm:first:pl-1 sm:last:pr-1">{Action}</td>
    </tr>
  )
}

const Skeleton = () => {
  return (
    <tr>
      <td className="border-b border-accent p-4 sm:first:pl-1 sm:last:pr-1">
        <div className="flex items-center gap-4">
          <div className="skeleton h-10 w-10 rounded-full"></div>
          <div>
            <div className="py-[0.1875rem]">
              <div className="skeleton h-3.5 w-14 rounded-sm"></div>
            </div>
            <div className="py-[0.1875rem]">
              <div className="skeleton h-3.5 w-36 rounded-sm"></div>
            </div>
          </div>
        </div>
      </td>

      <td className="border-b border-accent p-4 sm:first:pl-1 sm:last:pr-1">
        <div className="py-[0.3125rem]">
          <div className="skeleton h-3.5 w-36 rounded-sm"></div>
        </div>
      </td>

      <td className="border-b border-accent p-4 sm:first:pl-1 sm:last:pr-1">
        <div className="py-[0.3125rem]">
          <div className="skeleton h-3.5 w-36 rounded-sm"></div>
        </div>
      </td>

      <td className="border-b border-accent p-4 sm:first:pl-1 sm:last:pr-1"></td>
    </tr>
  )
}

export default Object.assign(MemberItem, {
  Skeleton
})
