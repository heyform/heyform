import { questionNumber } from '@heyform-inc/form-renderer'
import { FieldLayoutAlignEnum, QUESTION_FIELD_KINDS } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import type { FC } from 'react'
import { RefObject, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { FormFieldType } from '@/types'
import { cn } from '@/utils'

import { RichText } from '../../RichText'
import { useStoreContext } from '../../store'
import { Layout } from '../Layout'

export interface BlockProps extends ComponentProps {
  field: FormFieldType
  locale: string
  parentField?: FormFieldType
}

export const Block: FC<BlockProps> = ({
  className,
  field,
  locale,
  parentField,
  children,
  ...restProps
}) => {
  const { dispatch } = useStoreContext()
  const { t } = useTranslation()

  const titleRef = useRef<HTMLDivElement>(undefined)
  const descriptionRef = useRef<HTMLDivElement>(undefined)

  const isLabelShow = QUESTION_FIELD_KINDS.includes(field.kind)
  const isCoverShow = helper.isValid(field.layout?.mediaUrl)
  const isImageCover = helper.isURL(field.layout?.mediaUrl)

  function handleTitleChange(title: string) {
    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          title
        }
      }
    })
  }

  function handleDescriptionChange(description: string) {
    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          description
        }
      }
    })
  }

  const handleTitleChangeCallback = useCallback(handleTitleChange, [field.id])
  const handleDescriptionChangeCallback = useCallback(handleDescriptionChange, [field.id])

  // Reset RichText html
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current!.innerHTML = (field.title as string) || ''
    }

    if (descriptionRef.current) {
      descriptionRef.current!.innerHTML = (field.description as string) || ''
    }
  }, [field.id])

  return (
    <>
      <div className="heyform-theme-background" />

      {field.layout?.align !== FieldLayoutAlignEnum.INLINE && (
        <Layout className={`heyform-layout-${field.layout?.align}`} layout={field.layout} />
      )}

      {parentField && (
        <div className="heyform-block-group rounded-t-lg">
          <div className="heyform-block-group-container">
            <label className="heyform-block-number">
              {t('Question {{number}}', {
                number: questionNumber(parentField!.index),
                lng: locale
              })}
            </label>
            <div className="heyform-block-title">{parentField.title}</div>
          </div>
        </div>
      )}

      <div
        className={cn('heyform-block-container', {
          [`heyform-block-${field.layout?.align}`]: field.layout?.align
        })}
      >
        <div className="flex min-h-full flex-col items-center justify-center">
          <div className={cn('heyform-block', className)} {...restProps}>
            <div className="mb-10">
              {isLabelShow && (
                <label className="heyform-block-number">
                  {t('Question {{number}}', {
                    number: questionNumber(field.index, parentField?.index),
                    lng: locale
                  })}{' '}
                  {field.validations?.required && <span className="text-error">*</span>}
                </label>
              )}
              <RichText
                className="heyform-block-title"
                innerRef={titleRef as RefObject<HTMLDivElement>}
                placeholder={t('form.builder.compose.question')}
                onChange={handleTitleChangeCallback}
              />
              <RichText
                className="heyform-block-description"
                innerRef={descriptionRef as RefObject<HTMLDivElement>}
                placeholder={t('form.builder.compose.description')}
                onChange={handleDescriptionChangeCallback}
              />
            </div>

            {isCoverShow && field.layout?.align === FieldLayoutAlignEnum.INLINE && (
              <div className="heyform-block-image">
                {isImageCover ? (
                  <img src={field.layout?.mediaUrl} />
                ) : (
                  <div
                    style={{
                      backgroundImage: field.layout?.mediaUrl
                    }}
                  ></div>
                )}
              </div>
            )}

            {children}
          </div>
        </div>
      </div>
    </>
  )
}
