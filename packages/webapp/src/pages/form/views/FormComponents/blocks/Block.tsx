import { FieldLayoutAlignEnum, QUESTION_FIELD_KINDS } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import clsx from 'clsx'
import type { FC, WheelEvent } from 'react'
import { useEffect, useState } from 'react'

import { Layout } from '../components'
import { useStore } from '../store'
import type { IFormField } from '../typings'
import { questionNumber, removeHeading, useTranslation } from '../utils'
import { useWheelScroll } from './hook'

export interface BlockProps extends IComponentProps {
  field: IFormField
  paymentBlockIndex?: number
  isScrollable?: boolean
}

const SPLIT_LAYOUTS = [
  FieldLayoutAlignEnum.FLOAT_LEFT,
  FieldLayoutAlignEnum.FLOAT_RIGHT,
  FieldLayoutAlignEnum.SPLIT_LEFT,
  FieldLayoutAlignEnum.SPLIT_RIGHT
]

export const Block: FC<BlockProps> = ({
  className,
  field,
  paymentBlockIndex,
  isScrollable = true,
  children,
  ...restProps
}) => {
  const { state, dispatch } = useStore()
  const { t } = useTranslation()
  const [isEntered, setIsEntered] = useState(false)
  const isQuestion = QUESTION_FIELD_KINDS.includes(field.kind)
  const isInlineLayout = field.layout?.align === FieldLayoutAlignEnum.INLINE
  const isSplitLayout = SPLIT_LAYOUTS.includes(field.layout?.align as FieldLayoutAlignEnum)
  const [isScrolledToTop, setIsScrolledToTop] = useState(true)
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true)

  function handleScroll(event: WheelEvent<HTMLDivElement>) {
    const container = event.target as HTMLElement

    setIsScrolledToTop(container.scrollTop === 0)
    setIsScrolledToBottom(
      container.clientHeight + container.scrollTop + 60 >= container.scrollHeight
    )
  }

  const handleWheelScroll = useWheelScroll(
    isScrollable,
    isScrolledToTop,
    isScrolledToBottom,
    type => {
      dispatch({ type })
    }
  )

  useEffect(() => {
    if (state.scrollTo) {
      let isEntered = true

      if (helper.isValid(paymentBlockIndex) && paymentBlockIndex !== state.scrollIndex) {
        isEntered = false
      }

      setTimeout(() => {
        setIsEntered(isEntered)
      }, 10)
    }
  }, [paymentBlockIndex, state.scrollIndex, state.scrollTo])

  return (
    <div
      className={clsx('heyform-body', {
        'heyform-body-split-layout': isSplitLayout,
        'heyform-body-active': field.id === state.fields[state.scrollIndex!]?.id
      })}
    >
      {/* Theme background */}
      <div className="heyform-theme-background" />

      {/* Block container */}
      <div
        className={clsx('heyform-block-container', className)}
        onWheel={handleWheelScroll}
        {...restProps}
      >
        {field.parent && (
          <div className="heyform-block-group">
            <div className="heyform-block-group-container">
              <div className="heyform-block-number">
                {t('Question {{number}}', {
                  number: questionNumber(field.parent!.index)
                })}
              </div>
              <h2 className="heyform-block-title">{field.parent.title}</h2>
            </div>
          </div>
        )}

        <div
          className={clsx('heyform-block', {
            [`heyform-block-${state.scrollTo}`]: state.scrollTo,
            'heyform-block-entered': isEntered,
            [`heyform-block-${field.layout?.align}`]: field.layout?.align
          })}
        >
          <div className="heyform-block-scroll">
            {/* Field layout */}
            {!isInlineLayout && <Layout {...field.layout} />}

            <div className="heyform-scroll-wrapper" onScroll={handleScroll}>
              <div className="heyform-scroll-container">
                <div className="heyform-block-main">
                  <div className="heyform-block-wrapper">
                    <div className="heyform-block-header">
                      {isQuestion && (
                        <div
                          className={clsx(
                            'heyform-block-number',
                            `heyform-block-number-${questionNumber(
                              field.index,
                              field.parent?.index
                            )}`
                          )}
                        >
                          {t('Question {{number}}', {
                            number: questionNumber(field.index, field.parent?.index)
                          })}{' '}
                          {field.validations?.required && '*'}
                        </div>
                      )}
                      {field.title && (
                        <h1
                          className="heyform-block-title"
                          dangerouslySetInnerHTML={{ __html: removeHeading(field.title as string) }}
                        />
                      )}
                      {field.description && (
                        <div
                          className="heyform-block-description"
                          dangerouslySetInnerHTML={{ __html: field.description as string }}
                        />
                      )}
                    </div>

                    {isInlineLayout && <Layout {...field.layout} />}

                    {children}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
