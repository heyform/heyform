import { COUNTRIES } from '@heyform-inc/form-renderer'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Select } from '@/components'

import { useStoreContext } from '../../store'
import { RequiredSettingsProps } from './Required'

export default function PhoneNumber({ field }: RequiredSettingsProps) {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()

  const handleChange = useCallback(
    (key: string, value: any) => {
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
    },
    [dispatch, field.id, field.properties]
  )

  return (
    <div className="space-y-1">
      <label className="text-sm/6" htmlFor="#">
        {t('form.builder.settings.defaultCountry')}
      </label>

      <Select.Native
        className="mt-2 w-full"
        options={COUNTRIES}
        value={field.properties?.defaultCountryCode}
        multiLanguage
        onChange={value => handleChange('defaultCountryCode', value)}
      />
    </div>
  )
}
