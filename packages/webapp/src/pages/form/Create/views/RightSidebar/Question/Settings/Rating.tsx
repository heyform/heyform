import { IconCheck } from '@tabler/icons-react'
import type { FC } from 'react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Select } from '@/components/ui'
import {
  RATING_SHAPE_CONFIG,
  RATING_SHAPE_OPTIONS,
  RATING_TOTAL_OPTIONS
} from '@/pages/form/Create/consts'
import { useStoreContext } from '@/pages/form/Create/store'

import type { IBasicProps } from './Basic'

export const Rating: FC<IBasicProps> = ({ field }) => {
  const { t } = useTranslation()
  const { dispatch } = useStoreContext()

  function valueRender(option: any) {
    if (!option) {
      return null
    }

    return (
      <>
        {RATING_SHAPE_CONFIG[option.value]}
        <span>{t(option.label)}</span>
      </>
    )
  }

  function optionRender(option: any, isActive?: boolean) {
    return (
      <>
        {RATING_SHAPE_CONFIG[option.value]}
        <span className="select-option-text">{t(option.label)}</span>
        {isActive && (
          <span className="select-option-checkmark">
            <IconCheck />
          </span>
        )}
      </>
    )
  }

  function handleTotal(total: any) {
    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          properties: {
            ...field.properties,
            total
          }
        }
      }
    })
  }

  function handleShape(shape: any) {
    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          properties: {
            ...field.properties,
            shape
          }
        }
      }
    })
  }

  const handleTotalCallback = useCallback(handleTotal, [field.properties])
  const handleShapeCallback = useCallback(handleShape, [field.properties])

  return (
    <div className="right-sidebar-settings-item right-sidebar-rating">
      <div className="flex items-center">
        <Select
          className="mr-4 w-20"
          options={RATING_TOTAL_OPTIONS}
          value={field.properties?.total}
          onChange={handleTotalCallback}
        />
        <Select
          className="right-sidebar-custom-select flex-1"
          popupClassName="right-sidebar-custom-select-popup right-sidebar-rating-shape-popup"
          placement="bottom-end"
          options={RATING_SHAPE_OPTIONS}
          valueRender={valueRender as any}
          optionRender={optionRender}
          value={field.properties?.shape}
          onChange={handleShapeCallback}
        />
      </div>
    </div>
  )
}
