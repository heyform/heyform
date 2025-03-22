import { IconPlus } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

import { Button, Tooltip } from '@/components'
import { OnboardingBadge, useOnboardingStorage } from '@/components'
import { ADD_QUESTION_STORAGE_NAME } from '@/consts'
import { useAppStore } from '@/store'

export default function SidebarHeader() {
  const { t } = useTranslation()

  const { openModal } = useAppStore()
  const { setItem } = useOnboardingStorage()

  function handleOpenModal() {
    setItem(ADD_QUESTION_STORAGE_NAME, true)
    openModal('QuestionTypesModal')
  }

  return (
    <div className="flex h-12 items-center justify-between px-4 pb-2 pt-3">
      <div className="text-sm/6 font-medium text-primary">
        {t('form.builder.sidebar.questions')}
      </div>

      <div className="flex items-center">
        <Tooltip label={t('form.builder.sidebar.addQuestion')}>
          <Button.Link className="-mr-2" size="sm" iconOnly onClick={handleOpenModal}>
            <IconPlus className="h-5 w-5" />
            <OnboardingBadge name={ADD_QUESTION_STORAGE_NAME} />
          </Button.Link>
        </Tooltip>
      </div>
    </div>
  )
}
