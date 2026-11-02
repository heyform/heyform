import { useTranslation } from 'react-i18next'

import { Button } from '@/components'
import { useAppStore, useWorkspaceStore } from '@/store'

export default function WorkspaceDeletion() {
  const { t } = useTranslation()

  const { openModal } = useAppStore()
  const { workspace } = useWorkspaceStore()

  return (
    <section id="deletion" className="pt-10">
      <h2 className="hf-section-title">{t('settings.deletion.title')}</h2>
      <p data-slot="text" className="text-secondary mt-1 text-base/5 sm:text-sm/5">
        {t('settings.deletion.description')}
      </p>
      <Button.Ghost
        size="md"
        className="border-error/40 bg-error/10 text-error hover:bg-error/15 mt-4 border"
        onClick={() => openModal('WorkspaceDeletionModal', workspace)}
      >
        {t('settings.deletion.button')}
      </Button.Ghost>
    </section>
  )
}
