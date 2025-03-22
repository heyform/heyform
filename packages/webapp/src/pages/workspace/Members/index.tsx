import { useTranslation } from 'react-i18next'

import { Async, Button, Repeat } from '@/components'
import { WorkspaceService } from '@/services'
import { useAppStore, useWorkspaceStore } from '@/store'
import { useParam } from '@/utils'

import InvitationModal from './InvitationModal'
import MemberItem from './MemberItem'

export default function WorkspaceMembers() {
  const { t } = useTranslation()

  const { workspaceId } = useParam()
  const { members, setMembers } = useWorkspaceStore()
  const { openModal } = useAppStore()

  async function fetch() {
    setMembers(workspaceId, await WorkspaceService.members(workspaceId))
    return true
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl/8 font-semibold sm:text-xl/8">{t('members.title')}</h1>
        <Button size="md" onClick={() => openModal('InvitationModal')}>
          {t('members.invite.title')}
        </Button>
      </div>

      <div className="-mx-6 mt-8 overflow-x-auto whitespace-nowrap lg:-mx-10">
        <div className="inline-block min-w-full align-middle sm:px-10">
          <table className="min-w-full text-left text-sm/6">
            <thead className="text-secondary">
              <tr>
                <th className="border-b border-b-accent-light px-4 py-2 font-medium sm:first:pl-1 sm:last:pr-1">
                  {t('members.name')}
                </th>
                <th className="border-b border-b-accent-light px-4 py-2 font-medium sm:first:pl-1 sm:last:pr-1">
                  {t('members.role')}
                </th>
                <th className="border-b border-b-accent-light px-4 py-2 font-medium sm:first:pl-1 sm:last:pr-1">
                  {t('members.lastSeen')}
                </th>
                <th className="border-b border-b-accent-light px-4 py-2 font-medium sm:first:pl-1 sm:last:pr-1"></th>
              </tr>
            </thead>

            <tbody>
              <Async
                fetch={fetch}
                refreshDeps={[workspaceId]}
                loader={
                  <Repeat count={3}>
                    <MemberItem.Skeleton />
                  </Repeat>
                }
              >
                {members.map(m => (
                  <MemberItem key={m.id} member={m} />
                ))}
              </Async>
            </tbody>
          </table>
        </div>
      </div>

      <InvitationModal />
    </>
  )
}
