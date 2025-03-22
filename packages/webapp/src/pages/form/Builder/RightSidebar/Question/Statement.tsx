import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { startTransition, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components'

import { useStoreContext } from '../../store'
import { RequiredSettingsProps } from './Required'

export default function StatementSettings({ field }: RequiredSettingsProps) {
  const { t } = useTranslation()
  const { state, dispatch } = useStoreContext()

  const buttonText = useMemo(() => {
    if (field.properties?.buttonText) {
      return field.properties?.buttonText
    }

    switch (field.kind) {
      case FieldKindEnum.WELCOME:
      case FieldKindEnum.STATEMENT:
        return t('Next', { lng: state.locale })

      case FieldKindEnum.THANK_YOU:
        return t('Create a heyform', { lng: state.locale })
    }
  }, [field.kind, field.properties?.buttonText, state.locale, t])

  const handleChange = useCallback(
    (key: string, value: any) => {
      startTransition(() => {
        dispatch({
          type: 'updateField',
          payload: {
            id: field.id,
            updates: {
              properties: {
                ...field.properties,
                [key]: value
              }
            }
          }
        })
      })
    },
    [dispatch, field]
  )
  return (
    <div className="space-y-1">
      <label className="text-sm/6" htmlFor="#">
        {t('form.builder.settings.buttonText')}
      </label>

      <Input
        maxLength={24}
        value={buttonText}
        onChange={value => handleChange('buttonText', value)}
      />
    </div>
  )
}
