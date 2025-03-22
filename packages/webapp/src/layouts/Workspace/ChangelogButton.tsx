import { IconGift } from '@tabler/icons-react'
import { useLocalStorageState, useRequest } from 'ahooks'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { CHANGELOG_STORAGE_KEY } from '@/consts'
import { ChangelogService } from '@/services'
import { useAppStore } from '@/store'

export default function ChangelogButton() {
  const { t } = useTranslation()

  const [changelogId, setChangelogId] = useLocalStorageState(CHANGELOG_STORAGE_KEY)
  const { openModal } = useAppStore()
  const { data } = useRequest(async () => ChangelogService.latest())

  const isHasNew = useMemo(() => data && data.id !== changelogId, [changelogId, data])

  function handleClick() {
    if (data) {
      setChangelogId(data.id)
    }

    openModal('ChangelogsModal')
  }

  return (
    <div
      role="button"
      className="flex w-full items-center rounded-lg px-2.5 py-2.5 text-left text-sm font-medium hover:bg-accent-light sm:px-1.5 sm:py-1.5 lg:py-2"
      onClick={handleClick}
    >
      <div className="flex flex-1 items-center gap-3">
        <IconGift className="h-5 w-5 stroke-secondary group-hover:stroke-primary" />
        <span className="truncate">{t('workspace.sidebar.whatsNew')}</span>
      </div>

      {isHasNew && (
        <div className="pointer-events-none relative flex items-center justify-center">
          <span className="absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 h-3 w-3 origin-center animate-ping rounded-full border border-blue-600 bg-blue-600/50"></span>
          <span className="relative h-2 w-2 rounded-full bg-blue-600"></span>
        </div>
      )}
    </div>
  )
}
