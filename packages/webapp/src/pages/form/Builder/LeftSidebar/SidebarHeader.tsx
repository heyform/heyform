import { IconPlus } from '@tabler/icons-react'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Tooltip } from '@/components'
import { useAppStore } from '@/store'

export default function SidebarHeader({ action }: { action?: ReactNode }) {
  const { t } = useTranslation()

  const { openModal } = useAppStore()

  function handleOpenModal() {
    openModal('QuestionTypesModal')
  }

  return (
    <div className="flex h-12 items-center justify-between px-4 pb-2 pt-3">
      <div className="text-primary text-sm/6 font-medium">
        {t('form.builder.sidebar.questions')}
      </div>

      <div className="flex items-center">
        {action}
        <Tooltip label={t('form.builder.sidebar.addQuestion')}>
          <Button.Link className="-mr-2" size="sm" iconOnly onClick={handleOpenModal}>
            <IconPlus className="h-5 w-5" />
          </Button.Link>
        </Tooltip>
      </div>
    </div>
  )
}
