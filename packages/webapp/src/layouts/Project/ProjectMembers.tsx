import { useMemo } from 'react'

import { Async, Avatar, Repeat, Tooltip } from '@/components'
import { WorkspaceService } from '@/services'
import { useWorkspaceStore } from '@/store'
import { useParam } from '@/utils'

export default function ProjectMembers() {
  const { workspaceId } = useParam()
  const { project, members, setMembers } = useWorkspaceStore()

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
        </Async>
      </div>
    </div>
  )
}
