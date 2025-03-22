import { IconPlus } from '@tabler/icons-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Async, Avatar, Button, PlanUpgrade, Repeat, Tooltip } from '@/components'
import { PlanGradeEnum } from '@/consts'
import { WorkspaceService } from '@/services'
import { useAppStore, useWorkspaceStore } from '@/store'
import { useParam } from '@/utils'

export default function ProjectMembers() {
  const { t } = useTranslation()

  const { workspaceId } = useParam()
  const { project, members, setMembers } = useWorkspaceStore()
  const { openModal } = useAppStore()

  const exists = useMemo(
    () => members.filter(m => project?.members.includes(m.id)),
    [members, project?.members]
  )

  async function fetch() {
    setMembers(workspaceId, await WorkspaceService.members(workspaceId))
    return true
  }

  return (
    <div className="mt-2">
      <div className="flex items-center -space-x-2">
        <Async
          fetch={fetch}
          refreshDeps={[workspaceId]}
          loader={
            <Repeat count={6}>
              <div className="skeleton h-9 w-9 rounded-full ring-2 ring-foreground"></div>
            </Repeat>
          }
        >
          {exists.map(m => (
            <Tooltip key={m.id} label={m.name}>
              <div>
                <Avatar
                  className="h-9 w-9 rounded-full ring-2 ring-foreground"
                  src={m.avatar}
                  fallback={m.name}
                  resize={{ width: 100, height: 100 }}
                />
              </div>
            </Tooltip>
          ))}

          <PlanUpgrade
            minimalGrade={PlanGradeEnum.PREMIUM}
            isUpgradeShow={false}
            fallback={openUpgradeModal => (
              <Button.Ghost
                className="group rounded-full !p-0 hover:bg-foreground"
                size="md"
                iconOnly
                onClick={openUpgradeModal}
              >
                <IconPlus className="h-5 w-5 text-secondary group-hover:text-primary" />
              </Button.Ghost>
            )}
          >
            <Tooltip label={t('project.members.addMember', { name: project?.name })}>
              <Button.Ghost
                className="group rounded-full !p-0 hover:bg-foreground"
                size="md"
                iconOnly
                onClick={() => openModal('ProjectMembersModal')}
              >
                <IconPlus className="h-5 w-5 text-secondary group-hover:text-primary" />
              </Button.Ghost>
            </Tooltip>
          </PlanUpgrade>
        </Async>
      </div>
    </div>
  )
}
