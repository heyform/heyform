import { stopEvent } from '@heyform-inc/form-renderer'
import { FieldKindEnum, HiddenField, Variable } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { CSSProperties, FC, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Portal } from '@/components'
import { CUSTOM_FIELDS_CONFIGS, VARIABLE_KIND_CONFIGS } from '@/consts'
import { FormFieldType } from '@/types'
import { cn } from '@/utils'

import { QuestionIcon } from '../LeftSidebar/QuestionList'
import { useStoreContext } from '../store'

interface MentionMenuProps {
  visible?: boolean
  keyword?: string
  portalStyle?: CSSProperties
  onClose?: () => void
  onComplete?: (type: string, option: Partial<FormFieldType> | HiddenField | Variable) => void
}

interface MentionGroup {
  type: 'variable' | 'hiddenfield' | 'mention'
  configs?: AnyMap[]
  items: Array<Partial<FormFieldType> | HiddenField | Variable>
}

const MentionMenuComponent: FC<MentionMenuProps> = ({
  visible,
  keyword,
  portalStyle,
  onClose,
  onComplete
}) => {
  const { t } = useTranslation()

  const { state } = useStoreContext()
  const [groups, setGroups] = useState<MentionGroup[]>([])
  const [highlighted, setHighlighted] = useState<string>()

  function handleClose() {
    onClose?.()
  }

  const handleSelect = useCallback(
    (id: string) => {
      let option: Partial<FormFieldType> | HiddenField | Variable | undefined =
        state.variables?.find(v => v.id === id)
      let type = 'variable'

      if (!option) {
        option = state.hiddenFields?.find(h => h.id === id)

        if (option) {
          type = 'hiddenfield'
        } else {
          type = 'mention'
          option = state.references.find(r => r.id === id)!
        }
      }

      onComplete?.(type, option)
      handleClose()
    },
    [handleClose, onComplete, state.hiddenFields, state.references, state.variables]
  )

  const handleHighlight = useCallback(
    (code: string) => {
      const items = groups.map(g => g.items).flat()

      if (items.length < 1) {
        return
      }

      let index = items.findIndex(row => row.id === highlighted)

      if (code === 'ArrowUp') {
        index = index <= 0 ? items.length - 1 : index - 1
      } else {
        index = index >= items.length - 1 ? 0 : index + 1
      }

      setHighlighted(items[index].id)
    },
    [groups, highlighted]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Escape':
          return handleClose()

        case 'ArrowUp':
        case 'ArrowDown':
          return handleHighlight(event.code)

        case 'Enter':
          stopEvent(event)
          return handleSelect(highlighted!)
      }
    },
    [handleClose, handleHighlight, handleSelect, highlighted]
  )

  // Filter questions by keyword
  useEffect(() => {
    if (visible) {
      const newGroups: MentionGroup[] = []

      let questions = state.references
      let variables = state.variables || []
      let hiddenFields = state.hiddenFields || []

      if (helper.isValid(keyword)) {
        const lowerKeyword = keyword!.toLowerCase()

        questions = state.references.filter(row =>
          (row.title as string).toLowerCase().includes(lowerKeyword)
        )

        hiddenFields = state.hiddenFields.filter(row =>
          (row.name as string).toLowerCase().includes(lowerKeyword)
        )

        variables = (state.variables || []).filter(row =>
          row.name.toLowerCase().includes(lowerKeyword)
        )
      }

      if (questions.length > 0) {
        newGroups.push({
          type: 'mention',
          items: questions.map(q => ({ ...q, name: q.title }))
        })
      }

      if (hiddenFields.length > 0) {
        newGroups.push({
          type: 'hiddenfield',
          configs: CUSTOM_FIELDS_CONFIGS,
          items: hiddenFields.map(f => ({ ...f, kind: FieldKindEnum.HIDDEN_FIELDS }))
        })
      }

      if (variables.length > 0) {
        newGroups.push({
          type: 'variable',
          configs: VARIABLE_KIND_CONFIGS,
          items: variables
        })
      }

      setGroups(newGroups)
    }
  }, [state.references, state.variables, keyword, visible, state.hiddenFields])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <div className="mention-menu">
      <div className="mention-menu-mask" onClick={onClose} />
      <div
        className="mention-menu-container scrollbar isolate z-10 w-max min-w-52 overflow-y-auto rounded-xl bg-foreground p-1 shadow-lg outline outline-1 outline-transparent ring-1 ring-accent-light animate-in fade-in-0 zoom-in-95 focus:outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        style={portalStyle}
      >
        {groups.length > 0 ? (
          <div className="space-y-3 py-2">
            {groups.map(g => (
              <div key={g.type}>
                <div className="px-3.5 text-sm/6 text-secondary sm:px-3">
                  {t(`form.builder.mention.${g.type}`)}
                </div>
                {g.items.map(row => (
                  <div
                    key={row.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-x-2 rounded-lg border-0 px-3.5 py-2.5 text-left text-base/6 outline-none hover:bg-accent disabled:opacity-60 sm:px-3 sm:py-1.5 sm:text-sm/6',
                      {
                        'bg-input hover:bg-input': highlighted === row.id
                      }
                    )}
                    onClick={() => handleSelect(row.id!)}
                  >
                    <QuestionIcon
                      className="insert-field-item-icon mr-1 w-auto flex-shrink-0"
                      kind={(row as Any).kind}
                      configs={g.configs}
                    />
                    <span>{(row as Any).name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div>{t('form.builder.mention.emptyState')}</div>
        )}
      </div>
    </div>
  )
}

export const MentionMenu: FC<MentionMenuProps> = props => {
  return (
    <Portal visible={props.visible}>
      <MentionMenuComponent {...props} />
    </Portal>
  )
}
