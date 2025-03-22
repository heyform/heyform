import { htmlUtils } from '@heyform-inc/answer-utils'
import { numberToChar, questionNumber } from '@heyform-inc/form-renderer'
import {
  FieldKindEnum,
  OTHER_FIELD_KINDS,
  QUESTION_FIELD_KINDS
} from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconCaretDownFilled, IconDotsVertical, IconPlus } from '@tabler/icons-react'
import { FC, MouseEvent, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { ReactSortable } from 'react-sortablejs'

import { Button, Dropdown, Tooltip } from '@/components'
import { ALL_FIELD_CONFIGS } from '@/consts'
import { FormFieldType } from '@/types'
import { cn, nextTick } from '@/utils'

import { useStoreContext } from '../store'
import { getFieldFromKind } from '../utils'

interface QuestionIconProps extends ComponentProps {
  configs?: AnyMap[]
  kind: FieldKindEnum
  index?: number
  parentIndex?: number
}

export const QuestionIcon: FC<QuestionIconProps> = ({
  className,
  configs = ALL_FIELD_CONFIGS,
  kind,
  index,
  parentIndex,
  style
}) => {
  const config = useMemo(() => configs.find(c => c.kind === kind), [configs, kind])
  const label = useMemo(() => {
    if (index) {
      if (kind === FieldKindEnum.THANK_YOU) {
        return numberToChar(index).toUpperCase()
      }

      return questionNumber(index, parentIndex)
    }
  }, [index, kind, parentIndex])

  return (
    <div
      className={cn(
        'flex h-6 w-12 items-center justify-between rounded border border-input bg-foreground px-1.5 [&_[data-slot=icon]]:-ml-0.5 [&_[data-slot=icon]]:h-4 [&_[data-slot=icon]]:w-4 [&_[data-slot=index]]:text-xs [&_[data-slot=index]]:font-medium',
        className
      )}
      style={style}
      data-slot="question-icon"
    >
      {config?.icon && <config.icon data-slot="icon" />}
      {helper.isValid(label) && (
        <span className="text-xs/6 font-medium" data-slot="index">
          {label}
        </span>
      )}
    </div>
  )
}

interface QuestionProps extends ComponentProps {
  field: FormFieldType
  currentId?: string
  parentField?: FormFieldType
  isDeleteEnabled?: boolean
}

const Question: FC<QuestionProps> = ({
  className,
  field,
  currentId,
  parentField,
  isDeleteEnabled
}) => {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()

  const isSelected = useMemo(() => currentId === field.id, [currentId, field.id])
  const isGroup = useMemo(() => field.kind === FieldKindEnum.GROUP, [field.kind])
  const isGroupSelected = useMemo(
    () => isGroup && (isSelected || field.properties?.fields?.some(f => f.id === currentId)),
    [isGroup, isSelected, field.properties?.fields, currentId]
  )

  const options = useMemo(() => {
    const result = []

    if (!OTHER_FIELD_KINDS.includes(field.kind)) {
      result.push({
        label: 'components.duplicate',
        value: 'duplicate'
      })
    }

    if (!helper.isValid(field.index) || (helper.isValid(field.index) && isDeleteEnabled)) {
      result.push({
        label: 'components.delete',
        value: 'delete'
      })
    }

    return result
  }, [field.index, field.kind, isDeleteEnabled])

  const handleToggleCollapse = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()

      dispatch({
        type: 'updateField',
        payload: {
          id: field.id,
          updates: {
            isCollapsed: !field.isCollapsed
          }
        }
      })
    },
    [dispatch, field.id, field.isCollapsed]
  )

  const handleSortStart = useCallback(
    (event: any) => {
      dispatch({
        type: 'selectField',
        payload: {
          id: field.properties!.fields![event.oldIndex].id,
          parentId: field.id
        }
      })
    },
    [dispatch, field.id, field.properties]
  )

  const handleSortNestedFields = useCallback(
    (nestedFields: FormFieldType[], sortable: any) => {
      if (sortable) {
        nextTick(() => {
          dispatch({
            type: 'updateNestFields',
            payload: {
              id: field.id,
              nestedFields
            }
          })
        })
      }
    },
    [dispatch, field.id]
  )

  const handleClick = useCallback(() => {
    dispatch({
      type: 'selectField',
      payload: {
        id: field.id,
        parentId: parentField?.id
      }
    })
  }, [dispatch, field.id, parentField?.id])

  const handleMenuClick = useCallback(
    (value: string) => {
      switch (value) {
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
    },
    [dispatch, field.id, parentField?.id]
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
        className="question-children space-y-1 p-1"
        ghostClass="question-ghost"
        chosenClass="question-chosen"
        dragClass="question-dragging"
        fallbackClass="question-cloned"
        handle=".question-handle"
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
        fallbackOnBody
      >
        {nestedFields.map(child => (
          <Question
            key={child.id}
            field={child}
            currentId={currentId}
            parentField={field}
            isDeleteEnabled={true}
          />
        ))}
      </ReactSortable>
    )
  }, [field, handleSortNestedFields, handleSortStart, isGroup, currentId])

  return (
    <div
      className={cn(
        'question cursor-pointer select-none',
        {
          'question-selected': isSelected,
          'question-group': isGroup,
          'question-group-selected': isGroupSelected,
          'question-collapsed': field.isCollapsed
        },
        className
      )}
      data-active={isGroupSelected || isSelected}
    >
      <div className="question-item-body group flex h-12 rounded-lg" onClick={handleClick}>
        <div className="question-handle flex h-full flex-1 items-center py-2 pl-2">
          {/* Icon */}
          <QuestionIcon kind={field.kind} index={field.index} parentIndex={parentField?.index} />

          {/* Title */}
          <div className="question-title ml-3 mr-1 line-clamp-2 flex-1 shrink basis-0 overflow-hidden break-words text-xs font-semibold text-secondary group-hover:text-primary group-data-[active=true]/root:text-primary">
            {htmlUtils.plain(field.title as string)}
          </div>
        </div>

        <div className="flex h-full items-center gap-x-1 px-2">
          {/* Dropdown */}
          {options.length > 0 && (
            <Dropdown
              contentProps={{
                className: 'min-w-36 [&_[data-value=delete]]:text-error',
                side: 'bottom',
                sideOffset: 8,
                align: 'start'
              }}
              options={options}
              multiLanguage
              onClick={handleMenuClick}
            >
              <Button.Link
                className="question-dropdown !h-5 !w-5 rounded opacity-0 aria-expanded:bg-accent-light aria-expanded:opacity-100"
                size="sm"
                iconOnly
              >
                <Tooltip label={t('form.builder.question.menuTip')}>
                  <IconDotsVertical className="h-4 w-4 text-secondary" />
                </Tooltip>
              </Button.Link>
            </Dropdown>
          )}

          {isGroup && (
            <Button.Link
              className="question-collapsed !h-5 !w-5 rounded opacity-0"
              size="sm"
              iconOnly
              onClick={handleToggleCollapse}
            >
              <IconCaretDownFilled className="h-4 w-4 rotate-180 text-secondary transition-transform duration-150" />
            </Button.Link>
          )}
        </div>
      </div>

      {/* Questions inside group */}
      {NestedFields}
    </div>
  )
}

export default function QuestionList() {
  const { t } = useTranslation()
  const { state, dispatch } = useStoreContext()

  const isDeleteEnabled = useMemo(() => state.questions.length > 1, [state.questions])
  const data = useMemo(() => {
    let welcome: FormFieldType | null = null
    let thankYouIndex = 1
    const thankYous: FormFieldType[] = []
    const fields: FormFieldType[] = []

    for (const field of state.fields) {
      if (field.kind === FieldKindEnum.WELCOME) {
        welcome = field
      } else if (field.kind === FieldKindEnum.THANK_YOU) {
        thankYous.push({
          ...field,
          index: thankYouIndex
        })
        thankYouIndex += 1
      } else {
        fields.push(field)
      }
    }

    return {
      welcome,
      fields,
      thankYous
    }
  }, [state.fields])

  const handleSortStart = useCallback(
    (event: any) => {
      dispatch({
        type: 'selectField',
        payload: {
          id: data.fields[event.oldIndex].id
        }
      })
    },
    [data.fields, dispatch]
  )

  const handleSortFields = useCallback(
    (fields: FormFieldType[], sortable: any) => {
      if (sortable) {
        dispatch({
          type: 'setFields',
          payload: {
            fields: ([data.welcome, ...fields, ...data.thankYous] as FormFieldType[]).filter(
              helper.isValid
            )
          }
        })
      }
    },
    [data.thankYous, data.welcome, dispatch]
  )

  function handleAddEnding() {
    dispatch({
      type: 'addField',
      payload: {
        field: getFieldFromKind(FieldKindEnum.THANK_YOU)
      }
    })
  }

  const Sortable = useMemo(
    () => (
      <ReactSortable
        className="space-y-1"
        ghostClass="question-ghost"
        chosenClass="question-chosen"
        dragClass="question-dragging"
        fallbackClass="question-cloned"
        handle=".question-handle"
        list={data.fields}
        setList={handleSortFields}
        onStart={handleSortStart}
        group={{
          name: 'root',
          put: ['nested'],
          pull: true
        }}
        delay={10}
        animation={240}
      >
        {data.fields.map(field => (
          <Question
            key={field.id}
            field={field}
            currentId={state.currentId}
            isDeleteEnabled={isDeleteEnabled}
          />
        ))}
      </ReactSortable>
    ),
    [data.fields, handleSortFields, handleSortStart, isDeleteEnabled, state.currentId]
  )

  return (
    <PanelGroup className="!h-[calc(80vh-3.125rem)] sm:!h-full sm:flex-1" direction="vertical">
      <Panel defaultSize={70} maxSize={85}>
        <div className="scrollbar h-full px-2">
          {data.welcome && (
            <Question
              className="mb-1"
              field={data.welcome}
              currentId={state.currentId}
              isDeleteEnabled={isDeleteEnabled}
            />
          )}

          {Sortable}
        </div>
      </Panel>

      <PanelResizeHandle className="mx-2 border-t border-accent-light" />

      <Panel className="flex flex-col" defaultSize={30} maxSize={65}>
        <div className="flex items-center justify-between px-4 py-2">
          <div className="text-sm/6 font-medium text-primary">
            {t('form.builder.sidebar.endings')}
          </div>

          <div className="flex items-center">
            <Tooltip
              label={t('form.builder.sidebar.addEndingTip')}
              contentProps={{
                className: 'max-w-xs'
              }}
            >
              <Button.Link className="-mr-2" size="sm" iconOnly onClick={handleAddEnding}>
                <IconPlus className="h-5 w-5" />
              </Button.Link>
            </Tooltip>
          </div>
        </div>

        <div className="scrollbar flex-1 px-2">
          {data.thankYous.map(field => (
            <Question
              key={field.id}
              className="mb-2 mt-1"
              field={field}
              currentId={state.currentId}
              isDeleteEnabled={isDeleteEnabled}
            />
          ))}
        </div>
      </Panel>
    </PanelGroup>
  )
}
