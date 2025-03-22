import { RATING_SHAPE_ICONS } from '@heyform-inc/form-renderer'
import { startTransition, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Select } from '@/components'

import { useStoreContext } from '../../store'
import { RequiredSettingsProps } from './Required'

export default function Rating({ field }: RequiredSettingsProps) {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()

  const totalItems = Array.from({ length: 6 }, (_, index) => ({
    value: index + 5,
    label: index + 5
  }))

  const shapeItems = useMemo(
    () =>
      Object.keys(RATING_SHAPE_ICONS).map(key => ({
        value: key,
        label: t(`form.builder.settings.${key}`),
        icon: RATING_SHAPE_ICONS[key]
      })),
    [t]
  )

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
          {t('form.builder.settings.total')}
        </label>

        <Select
          type="number"
          options={totalItems}
          value={field.properties?.total || 5}
          onChange={value => handleChange('total', value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm/6" htmlFor="#">
          {t('form.builder.settings.shape')}
        </label>

        <Select
          className="heyform-rating-shape"
          options={shapeItems}
          contentProps={{
            className: 'heyform-rating-shape'
          }}
          value={field.properties?.shape}
          onChange={value => handleChange('shape', value)}
        />
      </div>
    </>
  )
}
