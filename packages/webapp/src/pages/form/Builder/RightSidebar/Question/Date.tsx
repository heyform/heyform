import { startTransition, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Select, Switch } from '@/components'
import { DATE_FORMAT_OPTIONS } from '@/consts'

import { useStoreContext } from '../../store'
import { RequiredSettingsProps } from './Required'

export default function DateSettings({ field }: RequiredSettingsProps) {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()

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
    <>
      <div className="flex items-center justify-between">
        <label className="text-sm/6" htmlFor="#">
          {t('form.builder.settings.dateFormat')}
        </label>
        <Select
          options={DATE_FORMAT_OPTIONS}
          value={field.properties?.format}
          onChange={value => handleChange('format', value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm/6" htmlFor="#">
          {t('form.builder.settings.timeField')}
        </label>
        <Switch
          value={field.properties?.allowTime}
          onChange={value => handleChange('allowTime', value)}
        />
      </div>
    </>
  )
}
