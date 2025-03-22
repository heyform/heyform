import { FieldKindEnum, QUESTION_FIELD_KINDS } from '@heyform-inc/shared-types-enums'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Switch } from '@/components'
import { FormFieldType } from '@/types'

import { useStoreContext } from '../../store'

export interface RequiredSettingsProps {
  field: FormFieldType
}

export default function RequiredSettings({ field }: RequiredSettingsProps) {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()

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
      <Switch value={field.validations?.required} onChange={handleChange} />
    </div>
  )
}
