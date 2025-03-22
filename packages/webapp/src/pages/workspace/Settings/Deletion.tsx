import { useTranslation } from 'react-i18next'

import { Button } from '@/components'
import { useAppStore, useWorkspaceStore } from '@/store'

export default function WorkspaceDeletion() {
  const { t } = useTranslation()

  const { openModal } = useAppStore()
  const { workspace } = useWorkspaceStore()

  return (
    <section id="deletion" className="pt-10">
      <h2 className="text-base font-semibold">{t('settings.deletion.title')}</h2>
      <p data-slot="text" className="mt-1 text-base/5 text-secondary sm:text-sm/5">
        {t('settings.deletion.description')}
      </p>

      <div className="mt-3">
        <Button.Ghost
          size="md"
          className="bg-error text-primary-light hover:bg-error/70 dark:text-primary"
          onClick={() => openModal('WorkspaceDeletionModal', workspace)}
        >
          {t('settings.deletion.button')}
        </Button.Ghost>
      </div>
    </section>
  )
}
