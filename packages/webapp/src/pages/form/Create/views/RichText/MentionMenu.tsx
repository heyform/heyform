import type {
  FieldKindEnum,
  FormField,
  HiddenField,
  Variable
} from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconSearch } from '@tabler/icons-react'
import type { CSSProperties, FC } from 'react'
import { useEffect, useMemo, useState } from 'react'

import { Menus, Portal } from '@/components/ui'
import { CUSTOM_FIELDS_CONFIGS } from '@/pages/form/Create/views/FieldConfig'

import { useStoreContext } from '../../store'
import { FieldIcon, VariableIcon } from '../FieldIcon'

interface MentionMenuProps extends Omit<IModalProps, 'onComplete'> {
  keyword?: string
  portalStyle?: CSSProperties
  onComplete?: (type: string, option: Partial<FormField> | HiddenField | Variable) => void
}

export const MentionMenu: FC<MentionMenuProps> = ({
  visible,
  keyword,
  portalStyle,
  onClose,
  onComplete
}) => {
  const { state } = useStoreContext()
  const [questions, setQuestions] = useState<Partial<FormField>[]>([])
  const [hiddenFields, setHiddenFields] = useState<HiddenField[]>([])
  const [variables, setVariables] = useState<Variable[]>([])

  function handleClose() {
    onClose?.()
  }

  function handleSelect(id?: IKeyType) {
    let option: Partial<FormField> | HiddenField | Variable | undefined = state.variables?.find(
      v => v.id === id
    )
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
  }

  // Filter questions by keyword
  useEffect(() => {
    if (visible) {
      let newQuestions = state.references
      let newVariables = state.variables || []
      let newHiddenFields = state.hiddenFields || []

      if (helper.isValid(keyword)) {
        const lowerKeyword = keyword!.toLowerCase()

        newQuestions = state.references.filter(row =>
          (row.title as string).toLowerCase().includes(lowerKeyword)
        )

        newHiddenFields = state.hiddenFields.filter(row =>
          (row.name as string).toLowerCase().includes(lowerKeyword)
        )

        newVariables = (state.variables || []).filter(row =>
          row.name.toLowerCase().includes(lowerKeyword)
        )
      }

      setQuestions(newQuestions)
      setHiddenFields(newHiddenFields)
      setVariables(newVariables)
    }
  }, [state.references, state.variables, keyword, visible, state.hiddenFields])

  const memoPortal = useMemo(
    () => (
      <div className="mention-menu">
        <div className="mention-menu-mask" onClick={onClose} />
        <Menus
          className="mention-menu-container scrollbar"
          style={portalStyle}
          onExited={onClose}
          onClick={handleSelect}
        >
          {questions.length > 0 || variables.length > 0 || hiddenFields.length > 0 ? (
            <>
              {questions.length > 0 && (
                <>
                  <Menus.Label label="Mention a question" />
                  {questions.map(row => (
                    <Menus.Item
                      key={row.id}
                      value={row.id}
                      icon={
                        <FieldIcon
                          className="insert-field-item-icon mr-3 flex-shrink-0"
                          kind={row.kind!}
                        />
                      }
                      label={row.title}
                    />
                  ))}
                </>
              )}

              {hiddenFields.length > 0 && (
                <>
                  <Menus.Label label="Mention a hidden field" />
                  {hiddenFields.map(row => (
                    <Menus.Item
                      key={row.id}
                      value={row.id}
                      icon={
                        <FieldIcon
                          className="insert-field-item-icon mr-3 flex-shrink-0"
                          kind={'hidden_fields' as FieldKindEnum}
                          configs={CUSTOM_FIELDS_CONFIGS}
                        />
                      }
                      label={row.name}
                    />
                  ))}
                </>
              )}

              {variables.length > 0 && (
                <>
                  <Menus.Label label="Mention a variable" />
                  {variables.map(row => (
                    <Menus.Item
                      key={row.id}
                      value={row.id}
                      icon={
                        <VariableIcon
                          className="insert-field-item-icon mr-3 flex-shrink-0"
                          kind={row.kind}
                        />
                      }
                      label={row.name}
                    />
                  ))}
                </>
              )}
            </>
          ) : (
            <Menus.Item icon={<IconSearch />} label="No questions found" />
          )}
          <Menus.Divider />
          <Menus.Item label="Learn about mention" />
        </Menus>
      </div>
    ),
    [portalStyle, questions]
  )

  return <Portal visible={visible}>{memoPortal}</Portal>
}
