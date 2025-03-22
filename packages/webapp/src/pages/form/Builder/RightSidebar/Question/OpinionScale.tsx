import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Input, Select } from '@/components'

import { useStoreContext } from '../../store'
import { RequiredSettingsProps } from './Required'

export default function OpinionScale({ field }: RequiredSettingsProps) {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()

  const options = Array.from({ length: 6 }, (_, index) => ({
    value: index + 5,
    label: index + 5
  }))

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
    <>
      <div className="flex items-center justify-between">
        <label className="text-sm/6" htmlFor="#">
          {t('form.builder.settings.total')}
        </label>

        <Select
          type="number"
          options={options}
          value={field.properties?.total || 5}
          onChange={value => handleChange('total', value)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm/6" htmlFor="#">
          {t('form.builder.settings.labels')}
        </label>

        <Input
          placeholder={t('form.builder.settings.leftLabel')}
          maxLength={24}
          value={field.properties?.leftLabel}
          onChange={value => handleChange('leftLabel', value)}
        />
        <Input
          placeholder={t('form.builder.settings.centerLabel')}
          maxLength={24}
          value={field.properties?.centerLabel}
          onChange={value => handleChange('centerLabel', value)}
        />
        <Input
          placeholder={t('form.builder.settings.rightLabel')}
          maxLength={24}
          value={field.properties?.rightLabel}
          onChange={value => handleChange('rightLabel', value)}
        />
      </div>
    </>
  )
}
