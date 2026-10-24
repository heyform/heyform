import { IconGift } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

export default function ChangelogButton() {
  const { t } = useTranslation()

  return (
    <a
      href="https://github.com/heyform/heyform/releases"
      target="_blank"
      rel="noreferrer"
      className="hf-sidebar-link"
    >
      <div className="flex flex-1 items-center gap-3">
        <IconGift className="hf-sidebar-link-icon" />
        <span className="truncate">{t('workspace.sidebar.whatsNew')}</span>
      </div>
    </a>
  )
}
