import { htmlUtils } from '@heyform-inc/answer-utils'
import { FieldKindEnum, OTHER_FIELD_KINDS, QUESTION_FIELD_KINDS } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconDotsVertical } from '@tabler/icons-react'
import clsx from 'clsx'
import { FC, startTransition, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ReactSortable } from 'react-sortablejs'

import { CollapseIcon } from '@/components'
import { Button, Dropdown, Menus, stopPropagation } from '@/components/ui'
import { FormField } from '@/models'
import { useStoreContext } from '@/pages/form/Create/store'

import { FieldKindIcon } from './FieldKindIcon'

interface FieldCardProps {
  field: FormField
  selectedId?: string
  parentField?: FormField
  isDeleteEnabled?: boolean
}

export const FieldCard: FC<FieldCardProps> = ({
  field,
  selectedId,
  parentField,
  isDeleteEnabled
}) => {
  const { dispatch } = useStoreContext()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const isSelected = useMemo(() => selectedId === field.id, [selectedId, field.id])
  const isGroup = useMemo(() => field.kind === FieldKindEnum.GROUP, [field.kind])
  const isGroupSelected = useMemo(
    () => isGroup && (isSelected || field.properties?.fields?.some(f => f.id === selectedId)),
    [isGroup, isSelected, field.properties?.fields, selectedId]
  )

  function handleClick() {
    dispatch({
      type: 'selectField',
      payload: {
        id: field.id,
        parentId: parentField?.id
      }
    })
  }

  function handleMenuClick(name?: IKeyType) {
    switch (name) {
      case 'duplicate':
        dispatch({
          type: 'duplicateField',
          payload: {
            id: field.id,
            parentId: parentField?.id
          }
        })
        break

      case 'delete':
        dispatch({
          type: 'deleteField',
          payload: {
            id: field.id,
            parentId: parentField?.id
          }
        })
        break
    }
  }

  function handleSortStart(event: any) {
    dispatch({
      type: 'selectField',
      payload: {
        id: field.properties!.fields![event.oldIndex].id,
        parentId: field.id
      }
    })
  }

  function handleSortNestedFields(nestedFields: FormField[], element: HTMLElement) {
    if (element) {
      setTimeout(() => {
        dispatch({
          type: 'updateNestFields',
          payload: {
            id: field.id,
            nestedFields
          }
        })
      }, 10)
    }
  }

  function handleToggleCollapse(event: any) {
    if (isGroup) {
      stopPropagation(event)
      startTransition(() => {
        dispatch({
          type: 'updateField',
          payload: {
            id: field.id,
            updates: {
              isCollapsed: !field.isCollapsed
            }
          }
        })
      })
    }
  }

  const DropdownTrigger = useMemo(
    () => (
      <Button.Link
        className="field-card-action h-8 w-8"
        leading={<IconDotsVertical />}
        onMouseDown={stopPropagation}
      />
    ),
    []
  )
  const DropdownOverlay = useMemo(
    () => (
      <Menus onClick={handleMenuClick}>
        {!OTHER_FIELD_KINDS.includes(field.kind) && (
          <Menus.Item value="duplicate" label={t('formBuilder.duplicate')} />
        )}
        {(helper.isEmpty(field.index) || (helper.isValid(field.index) && isDeleteEnabled)) && (
          <Menus.Item className="text-red-700" value="delete" label={t('formBuilder.delete')} />
        )}
      </Menus>
    ),
    [field.kind, isDeleteEnabled]
  )
  const NestedFields = useMemo(() => {
    if (!isGroup) {
      return null
    }

    let index = 1
    const nestedFields = (field.properties?.fields || []).map(child => ({
      ...child,
      index: QUESTION_FIELD_KINDS.includes(child.kind) ? index++ : undefined
    }))

    return (
      <ReactSortable
        className="field-card-children"
        ghostClass="field-card-ghost"
        chosenClass="field-card-chosen"
        dragClass="field-card-dragging"
        fallbackClass="field-card-cloned"
        list={nestedFields}
        setList={handleSortNestedFields}
        onStart={handleSortStart}
        group={{
          name: 'nested',
          pull: true,
          put: ['root', 'nested']
        }}
        delay={10}
        animation={240}
        swapThreshold="0.65"
        fallbackOnBody
      >
        {nestedFields.map(child => (
          <FieldCard
            key={child.id}
            field={child}
            selectedId={selectedId}
            parentField={field}
            isDeleteEnabled={true}
          />
        ))}
      </ReactSortable>
    )
  }, [field.properties?.fields, selectedId])

  return (
    <div
      className={clsx('field-card-root', {
        'field-card-group': isGroup,
        'field-card-group-selected': isGroupSelected,
        'field-card-group-collapsed': field.isCollapsed
      })}
    >
      <div
        className={clsx('field-card group flex cursor-pointer items-center pb-2 pr-1 pt-2', {
          'bg-slate-100': isSelected,
          'field-card-open': isOpen
        })}
        onClick={handleClick}
      >
        <div
          className="field-card-group-toggle-collapse"
          onMouseDown={stopPropagation}
          onClick={handleToggleCollapse}
        >
          {isGroup && (
            <CollapseIcon
              className={clsx({
                '-rotate-90 transform': field.isCollapsed
              })}
            />
          )}
        </div>
        <FieldKindIcon kind={field.kind} parentIndex={parentField?.index} index={field.index} />
        <div className="field-card-title ml-3 flex-1 text-xs">
          {htmlUtils.plain(field.title as string)}
        </div>
        <Dropdown
          className="opacity-0 group-hover:opacity-100"
          placement="bottom-start"
          overlay={DropdownOverlay}
          onDropdownVisibleChange={setIsOpen}
        >
          {DropdownTrigger}
        </Dropdown>
      </div>
      {NestedFields}
    </div>
  )
}
