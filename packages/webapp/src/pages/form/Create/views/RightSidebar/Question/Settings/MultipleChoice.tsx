import type { FC } from 'react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { NumberRange, SwitchField } from '@/components'
import { useStoreContext } from '@/pages/form/Create/store'

import type { IBasicProps } from './Basic'

export const MultipleChoice: FC<IBasicProps> = ({ field }) => {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()

  function handleAllowMultiple(allowMultiple: boolean) {
    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          properties: {
            ...field.properties,
            allowMultiple
          }
        }
      }
    })
  }

  function handleRandomize(randomize: boolean) {
    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          properties: {
            ...field.properties,
            randomize
          }
        }
      }
    })
  }

  function handleAllowOther(allowOther: boolean) {
    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          properties: {
            ...field.properties,
            allowOther
          }
        }
      }
    })
  }

  function handleRange(range: any) {
    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          validations: {
            ...field.validations,
            ...range
          }
        }
      }
    })
  }

  const handleAllowMultipleCallback = useCallback(handleAllowMultiple, [field.properties])
  const handleRandomizeCallback = useCallback(handleRandomize, [field.properties])
  const handleAllowOtherCallback = useCallback(handleAllowOther, [field.properties])
  const handleRangeCallback = useCallback(handleRange, [field.validations])

  return (
    <>
      <div className="right-sidebar-settings-item">
        <SwitchField
          label={t('formBuilder.multipleSelection')}
          value={field.properties?.allowMultiple}
          onChange={handleAllowMultipleCallback}
        />
        {field.properties?.allowMultiple && (
          <NumberRange
            className="mt-2"
            min={0}
            max={field.properties?.choices?.length || 1}
            value={field.validations}
            onChange={handleRangeCallback}
          />
        )}
      </div>
      <div className="right-sidebar-settings-item">
        <SwitchField
          label={t('formBuilder.randomize')}
          value={field.properties?.randomize}
          onChange={handleRandomizeCallback}
        />
      </div>
      <div className="right-sidebar-settings-item">
        <SwitchField
          label={t('formBuilder.otherOption')}
          value={field.properties?.allowOther}
          onChange={handleAllowOtherCallback}
        />
      </div>
    </>
  )
}
