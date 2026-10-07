import { FieldKindEnum, QUESTION_FIELD_KINDS } from '@heyform-inc/shared-types-enums'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { isChoiceBranchingField } from '@heyform-inc/answer-utils'

import { Switch, Tooltip } from '@/components'
import { FormFieldType } from '@/types'

import { useStoreContext } from '../../store'

// Branching choice questions must stay required, single-select and without "Other".
export function useIsChoiceBranching(field: FormFieldType) {
  const { state } = useStoreContext()

  return isChoiceBranchingField(
    field,
    state.logics?.find(l => l.fieldId === field.id)
  )
}

export interface RequiredSettingsProps {
  field: FormFieldType
}

export default function RequiredSettings({ field }: RequiredSettingsProps) {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()
  const isBranching = useIsChoiceBranching(field)

  const handleChange = useCallback(
    (required: boolean) => {
      dispatch({
        type: 'updateField',
        payload: {
          id: field.id,
          updates: {
            validations: {
              ...field.validations,
              required
            }
          }
        }
      })
    },
    [dispatch, field.id, field.validations]
  )

  if (!QUESTION_FIELD_KINDS.includes(field.kind) || field.kind === FieldKindEnum.GROUP) {
    return null
  }

  return (
    <div className="flex items-center justify-between">
      <label className="text-sm/6" htmlFor="#">
        {t('form.builder.settings.required')}
      </label>
      {/* Only block switching it off, so older branching questions can still be fixed. */}
      {isBranching && field.validations?.required ? (
        <Tooltip label={String(t('form.builder.logic.branching.requiredLocked'))}>
          <span>
            <Switch value disabled />
          </span>
        </Tooltip>
      ) : (
        <Switch value={field.validations?.required} onChange={handleChange} />
      )}
    </div>
  )
}
