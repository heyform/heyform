import { IconCheck } from '@tabler/icons-react'
import type { FC } from 'react'
import { startTransition, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Select } from '@/components/ui'
import { COUNTRIES } from '@/pages/form/Create/consts'
import { useStoreContext } from '@/pages/form/Create/store'

import { FlagIcon } from '../../../Compose/FlagIcon'
import type { IBasicProps } from './Basic'

export const PhoneNumber: FC<IBasicProps> = ({ field }) => {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()

  function valueRender(option: any) {
    if (!option) {
      return null
    }

    return (
      <>
        <FlagIcon countryCode={option.value} />
        <span className="flex-1 truncate">{t(option.label)}</span>
      </>
    )
  }

  function optionRender(option: any, isActive?: boolean) {
    return (
      <div className="relative flex cursor-pointer items-center px-3 py-1.5 hover:bg-slate-100">
        <FlagIcon countryCode={option.value} />
        <span className="flex-1 truncate">{t(option.label)}</span>
        {isActive && (
          <span className="select-option-checkmark">
            <IconCheck />
          </span>
        )}
      </div>
    )
  }

  function handleChange(defaultCountryCode: any) {
    startTransition(() => {
      dispatch({
        type: 'updateField',
        payload: {
          id: field.id,
          updates: {
            properties: {
              ...field.properties,
              defaultCountryCode
            }
          }
        }
      })
    })
  }

  const handleChangeCallback = useCallback(handleChange, [field.properties])

  return (
    <>
      <div className="right-sidebar-settings-item">
        <label className="form-item-label">{t('formBuilder.defaultCountry')}</label>
        <Select
          className="right-sidebar-custom-select mt-1"
          popupClassName="right-sidebar-custom-select-popup"
          options={COUNTRIES}
          value={field.properties?.defaultCountryCode}
          valueRender={valueRender as any}
          optionRender={optionRender}
          onChange={handleChangeCallback}
        />
      </div>
    </>
  )
}
