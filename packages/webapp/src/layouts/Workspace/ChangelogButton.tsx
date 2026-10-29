import { IconGift } from '@tabler/icons-react'
import { useLocalStorageState, useRequest } from 'ahooks'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { ChangelogService } from '@/services'

import { CHANGELOG_STORAGE_KEY } from '@/consts'

export default function ChangelogButton() {
  const { t } = useTranslation()

  const [changelogId, setChangelogId] = useLocalStorageState(CHANGELOG_STORAGE_KEY)
  const { data } = useRequest(async () => ChangelogService.latest())

  const isHasNew = useMemo(() => data && data.id !== changelogId, [changelogId, data])

  function handleClick() {
    if (data) {
      setChangelogId(data.id)
    }
  }

  return (
    <a
      href="https://github.com/heyform/heyform/releases"
      target="_blank"
      rel="noreferrer"
      className="hf-sidebar-link"
      onClick={handleClick}
    >
      <div className="flex flex-1 items-center gap-3">
        <IconGift className="hf-sidebar-link-icon" />
        <span className="truncate">{t('workspace.sidebar.whatsNew')}</span>
      </div>

      {isHasNew && (
        <div className="pointer-events-none relative flex items-center justify-center">
          <span className="absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 h-3 w-3 origin-center animate-ping rounded-full border border-blue-600 bg-blue-600/50"></span>
          <span className="relative h-2 w-2 rounded-full bg-blue-600"></span>
        </div>
      )}
    </a>
  )
}
