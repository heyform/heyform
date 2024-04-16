import { HiddenField } from '@heyform-inc/shared-types-enums'
import { IconDotsVertical, IconEyeOff } from '@tabler/icons-react'
import clsx from 'clsx'
import { FC, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Dropdown, Menus, notification, stopPropagation } from '@/components/ui'
import { useStoreContext } from '@/pages/form/Create/store'
import { FormService } from '@/service'
import { useParam } from '@/utils'

interface HiddenFieldCardProps {
  field: HiddenField
  onEdit: (field: HiddenField) => void
}

export const HiddenFieldCard: FC<HiddenFieldCardProps> = ({ field, onEdit }) => {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()
  const { formId } = useParam()

  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)

    try {
      await FormService.deleteHiddenField({
        formId,
        fieldId: field.id
      })

      dispatch({
        type: 'deleteHiddenField',
        payload: {
          id: field.id
        }
      })
    } catch (err: any) {
      notification.error({
        title: err.message
      })
    }

    setLoading(false)
  }

  function handleMenuClick(name?: IKeyType) {
    switch (name) {
      case 'edit':
        onEdit(field)
        break

      case 'delete':
        handleDelete()
        break
    }
  }

  const DropdownTrigger = useMemo(
    () => (
      <Button.Link
        className="field-card-action h-8 w-8"
        leading={<IconDotsVertical />}
        loading={loading}
        onMouseDown={stopPropagation}
      />
    ),
    [loading]
  )
  const DropdownOverlay = useMemo(
    () => (
      <Menus onClick={handleMenuClick}>
        <Menus.Item value="edit" label={t('formBuilder.edit')} />
        <Menus.Item value="delete" label={t('formBuilder.delete')} />
      </Menus>
    ),
    []
  )

  return (
    <div
      className={clsx('group flex items-center pb-2 pl-4 pr-1 pt-2', {
        'field-card-open': isOpen || loading
      })}
    >
      <div className="field-icon field-card-icon flex h-6 w-12 items-center justify-between rounded bg-[#e5e7eb] px-1.5 text-[#334155]">
        <IconEyeOff />
      </div>
      <div className="field-card-title ml-3 flex-1 text-xs">{field.name}</div>
      <Dropdown
        className="opacity-0 group-hover:opacity-100"
        placement="bottom-start"
        overlay={DropdownOverlay}
        disabled={loading}
        onDropdownVisibleChange={setIsOpen}
      >
        {DropdownTrigger}
      </Dropdown>
    </div>
  )
}
