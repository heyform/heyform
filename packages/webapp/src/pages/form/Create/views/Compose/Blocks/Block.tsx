import { FieldLayoutAlignEnum, FormField, QUESTION_FIELD_KINDS } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import clsx from 'clsx'
import type { FC } from 'react'
import { RefObject, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { questionNumber } from '@/components/formComponents'
import { useStoreContext } from '@/pages/form/Create/store'
import { RichText } from '@/pages/form/Create/views/RichText'

import { Layout } from '../Layout'

export interface BlockProps extends IComponentProps {
  field: FormField
  locale: string
  parentField?: FormField
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

  const titleRef = useRef<HTMLDivElement>()
  const descriptionRef = useRef<HTMLDivElement>()

  const isLabelShow = QUESTION_FIELD_KINDS.includes(field.kind)
  const isCoverShow = helper.isURL(field.layout?.mediaUrl)

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
        <div className="heyform-block-group">
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
        className={clsx('heyform-block-container', {
          [`heyform-block-${field.layout?.align}`]: field.layout?.align
        })}
      >
        <div className="flex min-h-full flex-col items-center justify-center">
          <div className={clsx('heyform-block', className)} {...restProps}>
            <div className="mb-10">
              {isLabelShow && (
                <label className="heyform-block-number">
                  {t('Question {{number}}', {
                    number: questionNumber(field.index, parentField?.index),
                    lng: locale
                  })}{' '}
                  {field.validations?.required && '*'}
                </label>
              )}
              <RichText
                className="heyform-block-title"
                innerRef={titleRef as RefObject<HTMLDivElement>}
                placeholder={t('formBuilder.questionPlaceholder')}
                onChange={handleTitleChangeCallback}
              />
              <RichText
                className="heyform-block-description"
                innerRef={descriptionRef as RefObject<HTMLDivElement>}
                placeholder={t('formBuilder.descriptionPlaceholder')}
                onChange={handleDescriptionChangeCallback}
              />
            </div>

            {isCoverShow && field.layout?.align === FieldLayoutAlignEnum.INLINE && (
              <div className="heyform-block-image">
                <img src={field.layout?.mediaUrl} />
              </div>
            )}

            {children}
          </div>
        </div>
      </div>
    </>
  )
}
