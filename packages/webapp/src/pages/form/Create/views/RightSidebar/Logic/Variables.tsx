import type { Variable } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconChevronRight, IconDots } from '@tabler/icons-react'
import type { FC } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Dropdown, Menus, stopPropagation } from '@/components/ui'
import { useStoreContext } from '@/pages/form/Create/store'
import { VariableIcon } from '@/pages/form/Create/views/FieldIcon'

interface VariableItemProps {
  variable: Variable
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

const VariableItem: FC<VariableItemProps> = ({ variable, onEdit, onDelete }) => {
  const { t } = useTranslation()

  function handleMenuClick(name?: IKeyType) {
    switch (name) {
      case 'edit':
        return onEdit?.(variable.id)

      case 'delete':
        return onDelete?.(variable.id)
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

  return (
    <div className="variable-item">
      <div className="variable-item-left">
        <div className="flex items-center">
          <VariableIcon kind={variable.kind} />
          <div className="variable-item-name">{variable.name}</div>
        </div>
        <div className="variable-item-value">
          {t('formBuilder.variable.value', { value: variable.value })}
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

export const Variables: FC = () => {
  const { t } = useTranslation()
  const { state, dispatch } = useStoreContext()

  function handleClick() {
    dispatch({
      type: 'togglePanel',
      payload: {
        isVariablePanelOpen: true
      }
    })
  }

  function handleEdit(variableId: string) {
    dispatch({
      type: 'selectVariable',
      payload: {
        variableId
      }
    })
    handleClick()
  }

  async function handleDelete(id: string) {
    dispatch({
      type: 'deleteVariable',
      payload: {
        id
      }
    })
  }

  return (
    <>
      <div className="right-sidebar-group">
        <div className="right-sidebar-group-title">
          <div className="flex items-center justify-between">
            <span>{t('formBuilder.variable.title')}</span>
            <Button.Link
              className="text-slate-500 hover:text-slate-900"
              trailing={<IconChevronRight />}
              onClick={handleClick}
            >
              {t('formBuilder.variable.add')}
            </Button.Link>
          </div>
        </div>

        <div className="right-sidebar-group-content">
          {helper.isValidArray(state.variables) ? (
            <div className="variable-list">
              {state.variables!.map(variable => (
                <VariableItem
                  key={variable.id}
                  variable={variable}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <p className="text-slate-500">{t('formBuilder.variable.empty')}</p>
          )}
        </div>
      </div>
    </>
  )
}
