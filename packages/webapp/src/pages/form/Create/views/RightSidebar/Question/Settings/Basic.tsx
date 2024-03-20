import type { FormField } from '@heyform-inc/shared-types-enums'
import type { FC } from 'react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { SwitchField } from '@/components'
import { useStoreContext } from '@/pages/form/Create/store'

export interface IBasicProps {
  field: FormField
}

export const Basic: FC<IBasicProps> = ({ field }) => {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()

  function handleChange(required: boolean) {
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
  }

  const handleChangeCallback = useCallback(handleChange, [field.validations])

  return (
    <div className="right-sidebar-settings-item">
      <SwitchField
        label={t('formBuilder.required')}
        value={field.validations?.required}
        onChange={handleChangeCallback}
      />
    </div>
  )
}
