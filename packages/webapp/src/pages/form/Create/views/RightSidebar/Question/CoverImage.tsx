import { FieldLayoutAlignEnum } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import type { FC } from 'react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PhotoPicker } from '@/components'
import { Button } from '@/components/ui'
import { useStoreContext } from '@/pages/form/Create/store'

export const CoverImage: FC = () => {
  const { t } = useTranslation()
  const { state, dispatch } = useStoreContext()
  const [visible, setVisible] = useState(false)

  const field = state.selectedField!
  const isLayoutEnabled = helper.isURL(field.layout?.mediaUrl)

  function handleOpen() {
    setVisible(true)
  }

  function handleClose() {
    setVisible(false)
  }

  function handleChange(value: string) {
    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          layout: {
            ...field.layout,
            mediaType: 'image',
            mediaUrl: value,
            brightness: field.layout?.brightness ?? 0,
            align: field.layout?.align || FieldLayoutAlignEnum.INLINE
          }
        }
      }
    })
  }

  function handleRemove() {
    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          layout: {}
        }
      }
    })
  }

  const handleChangeCallback = useCallback(handleChange, [field.id, field.layout])

  return (
    <>
      <div className="right-sidebar-group right-sidebar__cover-image">
        <div className="flex items-center justify-between">
          <label className="form-item-label">{t('formBuilder.image')}</label>
          {isLayoutEnabled ? (
            <div className="flex items-center">
              <Button className="mr-2" onClick={handleOpen}>
                {t('formBuilder.changeImage')}
              </Button>
              <Button onClick={handleRemove}>{t('formBuilder.removeImage')}</Button>
            </div>
          ) : (
            <Button onClick={handleOpen}>{t('formBuilder.addImage')}</Button>
          )}
        </div>
      </div>

      <PhotoPicker visible={visible} onClose={handleClose} onChange={handleChangeCallback} />
    </>
  )
}
