import { htmlUtils } from '@heyform-inc/answer-utils'
import { type Logic } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconChevronRight, IconDots } from '@tabler/icons-react'
import type { FC } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Dropdown, Menus, stopPropagation } from '@/components/ui'
import { type FormField } from '@/models'
import { useStoreContext } from '@/pages/form/Create/store'
import { FieldKindIcon } from '@/pages/form/Create/views/LeftSidebar/FieldKindIcon'

interface LogicItemProps {
  fields: FormField[]
  logic: Logic
  onEdit?: (field: FormField) => void
  onDelete?: (fieldId: string) => void
}

const LogicItem: FC<LogicItemProps> = ({ fields, logic, onEdit, onDelete }) => {
  const { t } = useTranslation()
  const field = useMemo(() => fields.find(f => f.id === logic.fieldId), [fields, logic.fieldId])
  const count = useMemo(() => logic.payloads.length, [logic])

  function handleMenuClick(value: any) {
    switch (value) {
      case 'edit':
        onEdit?.(field!)
        break

      case 'delete':
        onDelete?.(logic.fieldId)
        break
    }
  }

  const DropdownTrigger = useMemo(
    () => (
      <Button.Link
        className="field-card-action h-8 w-8"
        leading={<IconDots />}
        onMouseDown={stopPropagation}
      />
    ),
    []
  )
  const DropdownOverlay = useMemo(
    () => (
      <Menus onClick={handleMenuClick}>
        <Menus.Item value="edit" label={t('formBuilder.edit')} />
        <Menus.Item className="text-red-700" value="delete" label={t('formBuilder.delete')} />
      </Menus>
    ),
    []
  )

  if (!field) {
    return null
  }

  return (
    <div className="variable-item">
      <div className="variable-item-left">
        <div className="variable-item-name">
          <FieldKindIcon
            kind={field!.kind}
            index={field!.index}
            parentIndex={field!.parent?.index}
          />
          <span className="variable-item-span">{htmlUtils.plain(field!.title as string)}</span>
        </div>
        <div className="variable-item-value">
          {count > 1 ? t('formBuilder.multipleRules', { count }) : t('formBuilder.singleRule')}
        </div>
      </div>
      <Dropdown
        placement="bottom-end"
        popupClassName="variable-item-dropdown"
        overlay={DropdownOverlay}
      >
        {DropdownTrigger}
      </Dropdown>
    </div>
  )
}

export const Rules: FC = () => {
  const { t } = useTranslation()
  const { state, dispatch } = useStoreContext()

  function handleEdit(field: FormField) {
    dispatch({
      type: 'selectField',
      payload: {
        id: field.id,
        parentId: field.parent?.id
      }
    })
    dispatch({
      type: 'togglePanel',
      payload: {
        isLogicPanelOpen: true
      }
    })
  }

  function handleDelete(fieldId: string) {
    dispatch({
      type: 'deleteLogic',
      payload: {
        fieldId
      }
    })
  }

  function handleClick() {
    dispatch({
      type: 'togglePanel',
      payload: {
        isBulkEditPanelOpen: true
      }
    })
  }

  return (
    <div className="right-sidebar-group">
      <div className="right-sidebar-group-title">
        <div className="flex items-center justify-between">
          <span>{t('formBuilder.rules')}</span>
          <Button.Link
            className="text-slate-500 hover:text-slate-900"
            trailing={<IconChevronRight />}
            onClick={handleClick}
          >
            {t('formBuilder.bulkEdit')}
          </Button.Link>
        </div>
      </div>
      <div className="right-sidebar-group-content">
        {helper.isValidArray(state.logics) ? (
          <div className="variable-list rule-list">
            {state.logics!.map(logic => (
              <LogicItem
                key={logic.fieldId}
                fields={state.fields}
                logic={logic}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <p className="text-slate-500">{t('formBuilder.rulePlaceholder')}</p>
        )}
      </div>
    </div>
  )
}
