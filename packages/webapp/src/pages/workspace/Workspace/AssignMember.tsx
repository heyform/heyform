import { helper } from '@heyform-inc/utils'
import { observer } from 'mobx-react-lite'
import type { FC } from 'react'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar, Badge, Button } from '@/components/ui'
import type { UserModel } from '@/models'
import { useStore } from '@/store'

interface MemberItemProps {
  member: UserModel
  onClick: (member: UserModel) => void
}

export const MemberItem: FC<MemberItemProps> = ({ member, onClick }) => {
  function handleClick() {
    onClick(member)
  }

  const { t } = useTranslation()
  return (
    <div className="group -mx-2.5 flex items-center rounded-md p-2.5 text-sm text-slate-700 hover:bg-slate-50">
      <Avatar
        className="!h-10 !w-10"
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

      <Button
        className="px-2.5 py-0.5"
        rounded
        disabled={member.isSelf || member.isOwner}
        onClick={handleClick}
      >
        {member.isAssigned ? t('workspace.members.remove') : t('project.projectMembers.assign')}
      </Button>
    </div>
  )
}

interface AssignMemberProps extends Omit<IComponentProps, 'onChange'> {
  value?: string[]
  onChange?: (value: string[]) => void
}

export const AssignMember: FC<AssignMemberProps> = observer(({ value = [], onChange }) => {
  const workspaceStore = useStore('workspaceStore')
  const userStore = useStore('userStore')

  const members = useMemo(() => {
    return workspaceStore.members.map(m => {
      const isOwner = workspaceStore.workspace.ownerId === m.id
      const isSelf = userStore.user.id === m.id
      const isAssigned = value.includes(m.id) || isOwner || isSelf

      return {
        ...m,
        isAssigned,
        isOwner,
        isSelf
      }
    })
  }, [workspaceStore.members, value])

  function handleClick(member: UserModel) {
    if (value.includes(member.id)) {
      onChange?.(value.filter(id => id !== member.id))
    } else {
      onChange?.([...value, member.id])
    }
  }

  useEffect(() => {
    onChange?.(helper.uniqueArray([workspaceStore.workspace.ownerId, userStore.user.id]))
  }, [workspaceStore.workspace.id])

  return (
    <div>
      {members.map(row => (
        <MemberItem key={row.id} member={row} onClick={handleClick} />
      ))}
    </div>
  )
})
