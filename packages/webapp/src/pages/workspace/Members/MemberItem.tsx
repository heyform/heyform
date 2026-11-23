import { IconDots } from '@tabler/icons-react'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { WorkspaceService } from '@/services'
import { timeFromNow, useRouter } from '@/utils'

import { Avatar, Button, Dropdown, Tooltip, useAlert } from '@/components'
import { useUserStore, useWorkspaceStore } from '@/store'
import { MemberType } from '@/types'

const MemberItem: FC<{ member: MemberType }> = ({ member }) => {
  const { t, i18n } = useTranslation()

  const alert = useAlert()
  const router = useRouter()
  const { workspace, members, setWorkspaces, setMembers, removeMember, deleteWorkspace } =
    useWorkspaceStore()
  const { user } = useUserStore()

  const isYou = member.id === user.id

  function renderActions() {
    if (!workspace || (!workspace.isOwner && !isYou)) return null

    let options: { label: string; value: string }[]

    if (!workspace.isOwner) {
      options = [{ label: 'members.leave.title', value: 'leave' }]
    } else if (member.isOwner) {
      if (members.filter(row => row.isOwner).length < 2) return null
      options = [{ label: 'members.revokeOwner.title', value: 'revoke' }]
    } else {
      options = [
        { label: 'members.grantOwner.title', value: 'grant' },
        { label: 'members.transfer.title', value: 'transfer' },
        { label: 'members.remove.title', value: 'remove' }
      ]
    }

    async function refreshOwnership() {
      const [workspaces, members] = await Promise.all([
        WorkspaceService.workspaces(),
        WorkspaceService.members(workspace.id)
      ])

      setWorkspaces(workspaces)
      setMembers(workspace.id, members)
    }

    function handleSetOwner(isOwner: boolean) {
      const key = isOwner ? 'members.grantOwner' : 'members.revokeOwner'
      alert({
        title: String(t(`${key}.headline`, { name: member.name })),
        description: String(t(`${key}.subHeadline`)),
        cancelProps: { label: t('components.cancel') },
        confirmProps: { label: t(`${key}.title`) },
        fetch: async () => {
          await WorkspaceService.setMemberOwner(workspace.id, member.id, isOwner)
          await refreshOwnership()
        }
      })
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
          await refreshOwnership()
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
          router.replace('/')
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
        case 'grant':
        case 'revoke':
          return handleSetOwner(value === 'grant')

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
            <IconDots className="text-secondary h-5 w-5" />
          </Tooltip>
        </Button.Link>
      </Dropdown>
    )
  }

  return (
    <tr className="hover:bg-primary/[2.5%]">
      <td className="p-4 sm:first:pl-1 sm:last:pr-1">
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
                <span className="text-secondary ml-1 font-normal">({t('members.you')})</span>
              )}
            </div>
            <div className="text-secondary">{member.email}</div>
          </div>
        </div>
      </td>

      <td className="p-4 sm:first:pl-1 sm:last:pr-1">
        {member.isOwner ? t('members.owner') : t('members.member')}
      </td>

      <td className="p-4 sm:first:pl-1 sm:last:pr-1">
        {member.lastSeenAt ? timeFromNow(member.lastSeenAt, i18n.language) : ''}
      </td>

      <td className="p-4 sm:first:pl-1 sm:last:pr-1">{renderActions()}</td>
    </tr>
  )
}

const Skeleton = () => {
  return (
    <tr>
      <td className="p-4 sm:first:pl-1 sm:last:pr-1">
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

      <td className="p-4 sm:first:pl-1 sm:last:pr-1">
        <div className="py-[0.3125rem]">
          <div className="skeleton h-3.5 w-36 rounded-sm"></div>
        </div>
      </td>

      <td className="p-4 sm:first:pl-1 sm:last:pr-1">
        <div className="py-[0.3125rem]">
          <div className="skeleton h-3.5 w-36 rounded-sm"></div>
        </div>
      </td>

      <td className="p-4 sm:first:pl-1 sm:last:pr-1"></td>
    </tr>
  )
}

export default Object.assign(MemberItem, {
  Skeleton
})
