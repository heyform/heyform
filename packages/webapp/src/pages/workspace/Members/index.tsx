import { IconDots, IconLogout, IconSwitchHorizontal, IconTrash } from '@tabler/icons-react'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as timeago from 'timeago.js'

import { Avatar, Button, Dropdown, Heading, Menus, Table } from '@/components/ui'
import { TableColumn } from '@/components/ui/table'
import type { UserModel } from '@/models'
import { WorkspaceService } from '@/service'
import { useStore } from '@/store'
import { useAsyncEffect, useParam, useVisible } from '@/utils'

import { DeleteMember } from './DeleteMember'
import { InviteMember } from './InviteMember'
import { LeaveWorkspace } from './LeaveWorkspace'
import { TransferWorkspace } from './TransferWorkspace'

const Members = observer(() => {
  const { workspaceId } = useParam()
  const userStore = useStore('userStore')
  const workspaceStore = useStore('workspaceStore')

  const [member, setMember] = useState<UserModel | null>(null)
  const [inviteMemberVisible, openInviteMember, closeInviteMember] = useVisible()
  const [transferWorkspaceVisible, openTransferWorkspace, closeTransferWorkspace] = useVisible()
  const [deleteMemberVisible, openDeleteMember, closeDeleteMember] = useVisible()
  const [leaveWorkspaceVisible, openLeaveWorkspace, closeLeaveWorkspace] = useVisible()
  const { t } = useTranslation()

  // Table columns
  const columns: TableColumn<UserModel>[] = [
    {
      key: 'id',
      name: t('workspace.members.index.member'),
      width: '40%',
      render(record) {
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Avatar className="h-9 w-9" src={record.avatar} size={80} rounded circular />
            </div>
            <div className="flex-1 px-4">
              <p className="truncate text-sm font-semibold text-slate-800">
                {record.name} {userStore.user.id === record.id && <span>(You)</span>}
              </p>
              <p className="mt-0.5 flex items-center text-sm font-normal text-slate-500">
                <span className="truncate">{record.email}</span>
              </p>
            </div>
          </div>
        )
      }
    },
    {
      key: 'role',
      name: t('workspace.members.Role'),
      width: '30%',
      render(record) {
        if (record.id === workspaceStore.workspace.ownerId) {
          return (
            <>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                {t('workspace.members.index.owner')}
              </span>
            </>
          )
        }
        return (
          <>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
              {t('workspace.members.index.member')}
            </span>
          </>
        )
      }
    },
    {
      key: 'last_seen',
      name: t('workspace.members.LastSeen'),
      width: '20%',
      render(record) {
        if (record.lastSeenAt) {
          return timeago.format(record.lastSeenAt * 1_000)
        }
      }
    },
    {
      key: 'action',
      name: t('workspace.members.Action'),
      align: 'right',
      render(record) {
        if (workspaceStore.workspace.isOwner) {
          if (record.id === userStore.user.id) {
            return null
          }
        } else {
          if (record.id !== userStore.user.id) {
            return null
          }
        }

        function handleMenuClick(name?: IKeyType) {
          setMember(record)

          switch (name) {
            case 'remove':
              openDeleteMember()
              break

            case 'transfer':
              openTransferWorkspace()
              break

            case 'leave':
              openLeaveWorkspace()
              break
          }
        }

        const OwnerOverlay = (
          <Menus onClick={handleMenuClick}>
            <Menus.Item
              value="transfer"
              icon={<IconSwitchHorizontal />}
              label={t('workspace.members.index.transfer')}
            />
            <Menus.Item value="remove" icon={<IconTrash />} label={t('workspace.members.remove')} />
          </Menus>
        )

        const MemberOverlay = (
          <Menus onClick={handleMenuClick}>
            <Menus.Item
              value="leave"
              icon={<IconLogout />}
              label={t('workspace.members.index.leave')}
            />
          </Menus>
        )

        return (
          <Dropdown
            className="inline-flex cursor-pointer rounded-md p-1 hover:bg-slate-100"
            overlay={workspaceStore.workspace.isOwner ? OwnerOverlay : MemberOverlay}
          >
            <IconDots className="h-5 w-5 text-slate-400 hover:text-slate-900" />
          </Dropdown>
        )
      }
    }
  ]

  useAsyncEffect(async () => {
    const result = await WorkspaceService.members(workspaceId)
    workspaceStore.setMembers(workspaceId, result)
  }, [workspaceId])

  return (
    <div>
      <Heading
        title={t('workspace.members.member')}
        description={t('workspace.members.manage')}
        actions={
          <Button type="primary" onClick={openInviteMember}>
            {t('workspace.members.index.invite')}
          </Button>
        }
      />
      <div className="py-4">
        <Table<UserModel> className="mt-8" columns={columns} data={workspaceStore.members} />
      </div>

      {/* Invite member */}
      <InviteMember visible={inviteMemberVisible} onClose={closeInviteMember} />

      {/* Transfer workspace */}
      <TransferWorkspace
        visible={transferWorkspaceVisible}
        member={member}
        onClose={closeTransferWorkspace}
      />

      {/* Delete member */}
      <DeleteMember visible={deleteMemberVisible} member={member} onClose={closeDeleteMember} />

      {/* Leave workspace */}
      <LeaveWorkspace visible={leaveWorkspaceVisible} onClose={closeLeaveWorkspace} />
    </div>
  )
})

export default Members
