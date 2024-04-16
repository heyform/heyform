import { HiddenField } from '@heyform-inc/shared-types-enums'
import { IconHelp, IconPlus } from '@tabler/icons-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Tooltip } from '@/components/ui'
import { useVisible } from '@/utils'

import { useStoreContext } from '../../store'
import { CreateHiddenField } from './CreateHiddenField'
import { EditHiddenField } from './EditHiddenField'
import { HiddenFieldCard } from './HiddenFieldCard'

export const HiddenFields = () => {
  const { t } = useTranslation()
  const { state, dispatch } = useStoreContext()

  const [isCreateHiddenFieldOpen, openCreateHiddenField, closeCreateHiddenField] = useVisible()
  const [isEditHiddenFieldOpen, openEditHiddenField, closeEditHiddenField] = useVisible()

  const [hiddenField, setHiddenField] = useState<HiddenField | null>(null)

  function handleEditHiddenField(field: HiddenField) {
    openEditHiddenField()
    setHiddenField(field)
  }

  function handleEditHiddenFieldClose() {
    closeEditHiddenField()
    setHiddenField(null)
  }

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-4">
          <h2 className="flex items-center gap-1">
            <span>{t('formBuilder.hiddenFields')}</span>
            <Tooltip ariaLabel={t('formBuilder.hiddenFieldsTip')}>
              <a href="https://docs.heyform.net/hidden-fields" target="_blank">
                <IconHelp className="h-5 w-5 text-slate-400" />
              </a>
            </Tooltip>
          </h2>
          <Button.Link className="h-6 w-6" leading={<IconPlus />} onClick={openCreateHiddenField} />
        </div>
        <div className="scrollbar flex-1">
          {state.hiddenFields?.map(field => (
            <HiddenFieldCard key={field.id} field={field} onEdit={handleEditHiddenField} />
          ))}
        </div>
      </div>

      <CreateHiddenField visible={isCreateHiddenFieldOpen} onClose={closeCreateHiddenField} />
      <EditHiddenField
        visible={isEditHiddenFieldOpen}
        hiddenField={hiddenField}
        onClose={handleEditHiddenFieldClose}
      />
    </>
  )
}
