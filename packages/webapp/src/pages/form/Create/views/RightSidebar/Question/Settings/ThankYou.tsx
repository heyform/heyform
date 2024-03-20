import type { FC } from 'react'
import { startTransition } from 'react'
import { useTranslation } from 'react-i18next'

import { SwitchField } from '@/components'
import { Input } from '@/components/ui'
import { useStoreContext } from '@/pages/form/Create/store'

import type { IBasicProps } from './Basic'

export const ThankYou: FC<IBasicProps> = ({ field }) => {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()

  function handleEnableCallback(redirectOnCompletion: boolean) {
    handleChange({
      redirectOnCompletion
    })
  }

  function handleUrlChangeCallback(redirectUrl: any) {
    handleChange({
      redirectUrl
    })
  }

  function handleChange(updates: IMapType) {
    startTransition(() => {
      dispatch({
        type: 'updateField',
        payload: {
          id: field.id,
          updates: {
            properties: {
              ...field.properties,
              ...updates
            }
          }
        }
      })
    })
  }

  return (
    <div className="right-sidebar-settings-item">
      <SwitchField
        label={t('formBuilder.redirect')}
        value={field.properties?.redirectOnCompletion}
        onChange={handleEnableCallback}
      />
      {field.properties?.redirectOnCompletion && (
        <Input
          className="mt-1"
          type="url"
          placeholder="https://example.com"
          value={field.properties?.redirectUrl}
          onChange={handleUrlChangeCallback}
        />
      )}
    </div>
  )
}
