import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { FieldList } from './FieldList'
import { InsertFieldDropdown } from './InsertFieldDropdown'

const LeftSidebarComponent = () => {
  const { t } = useTranslation()

  return (
    <div className="left-sidebar flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center justify-between p-4">
        <h2>{t('formBuilder.Content')}</h2>
        <InsertFieldDropdown />
      </div>

      <FieldList />
    </div>
  )
}

export const LeftSidebar = memo(LeftSidebarComponent)
