import { FieldLayoutAlignEnum } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { startTransition, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, ImagePicker } from '@/components'
import { LAYOUT_OPTIONS } from '@/consts'
import { cn } from '@/utils'

import { useStoreContext } from '../../store'
import ImageBrightness from './ImageBrightness'

export default function CoverAndLayout() {
  const { t } = useTranslation()
  const { state, dispatch } = useStoreContext()
  const field = state.currentField!

  const handleChange = useCallback(
    (key: string, value: any) => {
      startTransition(() => {
        let layout = field.layout

        if (key === 'mediaUrl') {
          layout = {
            ...layout,
            mediaType: 'image',
            brightness: field.layout?.brightness ?? 0,
            align: field.layout?.align || FieldLayoutAlignEnum.INLINE
          }
        }

        dispatch({
          type: 'updateField',
          payload: {
            id: field.id,
            updates: {
              layout: {
                ...layout,
                [key]: value
              }
            }
          }
        })
      })
    },
    [dispatch, field]
  )

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

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <label className="text-sm/6" htmlFor="#">
          {t('components.imagePicker.image')}
        </label>

        <div className="flex items-center gap-2">
          <ImagePicker
            tabs={['image', 'unsplash']}
            onChange={value => handleChange('mediaUrl', value)}
          >
            <Button.Ghost size="sm">
              {t(helper.isURL(field.layout?.mediaUrl) ? 'components.change' : 'components.add')}
            </Button.Ghost>
          </ImagePicker>

          {helper.isURL(field.layout?.mediaUrl) && (
            <Button.Ghost size="sm" onClick={handleRemove}>
              {t('components.remove')}
            </Button.Ghost>
          )}
        </div>
      </div>

      {helper.isURL(field.layout?.mediaUrl) && (
        <>
          {field.layout?.align !== FieldLayoutAlignEnum.INLINE && (
            <div className="mt-4 border-t border-accent-light pt-4">
              <ImageBrightness
                imageURL={field.layout?.mediaUrl}
                value={field.layout?.brightness}
                onChange={value => handleChange('brightness', value)}
              />
            </div>
          )}

          <div className="mt-4 space-y-1 border-t border-accent-light pt-4">
            <label className="text-sm/6" htmlFor="#">
              {t('form.builder.settings.layout')}
            </label>

            <div className="grid grid-cols-3 gap-3">
              {LAYOUT_OPTIONS.map(row => (
                <div
                  key={row.value}
                  className={cn(
                    'cursor-pointer rounded-lg border border-input text-secondary ring-1 ring-transparent hover:border-primary hover:text-primary',
                    {
                      'border-primary text-primary ring-input': field.layout?.align === row.value
                    }
                  )}
                  onClick={() => handleChange('align', row.value)}
                >
                  <row.icon className="h-auto w-full" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
