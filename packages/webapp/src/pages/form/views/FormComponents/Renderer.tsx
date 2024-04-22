import { applyLogicToFields } from '@heyform-inc/answer-utils'
import {
  ActionEnum,
  FieldKindEnum,
  FormField,
  OTHER_FIELD_KINDS,
  QUESTION_FIELD_KINDS
} from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import clsx from 'clsx'
import type { FC } from 'react'
import { useEffect, useMemo, useReducer, useState } from 'react'

import { FORM_LOCALES_OPTIONS } from '@/consts'
import { useQuery } from '@/utils'

import { ClosedMessage } from './blocks/ClosedMessage'
import type { IState, IStripe } from './store'
import { StoreContext, StoreReducer, getStorage } from './store'
import { getTheme } from './theme'
import type { IFormModel } from './typings'
import {
  flattenFieldsWithGroups,
  getPreferredLanguage,
  parseFields,
  progressPercentage
} from './utils'
import { Blocks } from './views/Blocks'
import { Sidebar } from './views/Sidebar'

export interface RendererProps {
  className?: string
  form: IFormModel
  stripeApiKey?: string
  stripeAccountId?: string
  autoSave?: boolean
  customUrlRedirects?: boolean
  reportAbuseURL?: string
  alwaysShowNextButton?: boolean
  onSubmit?: (values: Record<string, any>, isPartial?: boolean, stripe?: IStripe) => Promise<void>
}

function initStore(form: IFormModel, autoSave: boolean, allowPayment: boolean): IState {
  const locale = getPreferredLanguage({
    languages: FORM_LOCALES_OPTIONS.map(l => l.value),
    fallback: form.settings?.locale || 'en'
  })
  const list = parseFields(form.fields, form.translations?.[locale])

  const welcomeField = list.find(f => f.kind === FieldKindEnum.WELCOME)
  const thankYouField = list.find(f => f.kind === FieldKindEnum.THANK_YOU)

  let allFields = flattenFieldsWithGroups(list.filter(f => !OTHER_FIELD_KINDS.includes(f.kind)))

  if (!allowPayment) {
    allFields = allFields.filter(f => f.kind !== FieldKindEnum.PAYMENT)
  }

  const jumpFieldIds = (form.logics || [])
    .filter(l => l.payloads.some(p => p.action.kind === ActionEnum.NAVIGATE))
    .map(l => l.fieldId)

  const values = getStorage(form.id, autoSave)
  const { fields, variables } = applyLogicToFields(
    [...allFields, thankYouField].filter(Boolean) as FormField[],
    form.logics,
    form.variables,
    values
  )

  // Calculate answering progress percentage
  const questionCount = fields.filter(f => QUESTION_FIELD_KINDS.includes(f.kind)).length
  const percentage = progressPercentage(Object.keys(values).length, questionCount)

  return {
    welcomeField,
    thankYouField,
    allFields,
    fields,
    hiddenFields: form.hiddenFields || [],
    translations: form.translations,
    query: {},
    jumpFieldIds,
    logics: form.logics,
    parameters: form.variables,
    variables,
    values,
    percentage,
    questionCount,
    formId: form.id,
    scrollIndex: 0,
    scrollTo: 'next',
    settings: form.settings,
    autoSave,
    locale,
    theme: getTheme(form.themeSettings?.theme)
  }
}

export const Renderer: FC<RendererProps> = ({
  className,
  form,
  autoSave = true,
  stripeApiKey,
  stripeAccountId,
  reportAbuseURL,
  alwaysShowNextButton = false,
  customUrlRedirects = false,
  onSubmit
}) => {
  const query = useQuery()
  const [isAndroid, setAndroid] = useState(false)

  useEffect(() => {
    setAndroid(window.heyform.device.android)
  }, [])

  const allowPayment = useMemo(
    () => !!(stripeApiKey && stripeAccountId),
    [stripeApiKey, stripeAccountId]
  )
  const memoState: IState = useMemo(
    () => ({
      reportAbuseURL,
      customUrlRedirects,
      alwaysShowNextButton,
      onSubmit,
      ...initStore(form, autoSave, allowPayment),
      query
    }),
    [
      reportAbuseURL,
      customUrlRedirects,
      alwaysShowNextButton,
      onSubmit,
      query,
      form,
      autoSave,
      allowPayment
    ]
  )
  const [state, dispatch] = useReducer(StoreReducer, memoState)

  if (!helper.isValidArray(form.fields)) {
    return <ClosedMessage form={form} />
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (allowPayment) {
      const paymentField = memoState.fields.find(f => f.kind === FieldKindEnum.PAYMENT)

      if (paymentField) {
        const stripe = (window as any).Stripe(stripeApiKey, {
          stripeAccount: stripeAccountId
        })

        dispatch({
          type: 'setStripe',
          payload: {
            stripe: {
              elements: stripe.elements({ locale: memoState.locale }),
              confirmCardPayment: stripe.confirmCardPayment.bind(stripe),
              apiKey: stripeApiKey,
              accountId: stripeAccountId
            }
          }
        })
      }
    }
  }, [])

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      <div
        className={clsx(
          'heyform-root',
          {
            'heyform-root-open': state.isSidebarOpen,
            'heyform-root-android': isAndroid
          },
          className
        )}
      >
        <div
          className={clsx('heyform-wrapper', {
            'heyform-is-welcome': !state.isStarted && state.welcomeField
          })}
        >
          <Blocks />
        </div>
        <Sidebar />
      </div>
    </StoreContext.Provider>
  )
}
