import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import type { FC } from 'react'
import { startTransition, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui'
import { useStoreContext } from '@/pages/form/Create/store'

import type { IBasicProps } from './Basic'

export const Statement: FC<IBasicProps> = ({ field }) => {
  const { t } = useTranslation()
  const { state, dispatch } = useStoreContext()

  function handleChange(buttonText: any) {
    startTransition(() => {
      dispatch({
        type: 'updateField',
        payload: {
          id: field.id,
          updates: {
            properties: {
              ...field.properties,
              buttonText
            }
          }
        }
      })
    })
  }

  const handleChangeCallback = useCallback(handleChange, [field.properties])
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
  }, [field.properties?.buttonText, state.locale])

  return (
    <div className="right-sidebar-settings-item">
      <label className="form-item-label">{t('formBuilder.buttonText')}</label>
      <Input className="mt-1" value={buttonText} maxLength={24} onChange={handleChangeCallback} />
    </div>
  )
}
