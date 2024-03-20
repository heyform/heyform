import type { FC } from 'react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { SwitchField } from '@/components'
import { Select } from '@/components/ui'
import { DATE_FORMAT_OPTIONS } from '@/pages/form/Create/consts'
import { useStoreContext } from '@/pages/form/Create/store'

import type { IBasicProps } from './Basic'

export const Date: FC<IBasicProps> = ({ field }) => {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()

  function handleChange(format: any) {
    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          properties: {
            ...field.properties,
            format
          }
        }
      }
    })
  }

  function handleAllowTimeChange(allowTime: boolean) {
    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          properties: {
            ...field.properties,
            allowTime
          }
        }
      }
    })
  }

  const handleChangeCallback = useCallback(handleChange, [field.properties])
  const handleAllowTimeChangeCallback = useCallback(handleAllowTimeChange, [field.properties])

  return (
    <>
      <div className="right-sidebar-settings-item">
        <label className="form-item-label">{t('formBuilder.dateFormat')}</label>
        <Select
          className="mt-1"
          options={DATE_FORMAT_OPTIONS}
          value={field.properties?.format}
          onChange={handleChangeCallback}
        />
      </div>

      <div className="right-sidebar-settings-item">
        <SwitchField
          label={t('formBuilder.timeField')}
          value={field.properties?.allowTime}
          onChange={handleAllowTimeChangeCallback}
        />
      </div>
    </>
  )
}
