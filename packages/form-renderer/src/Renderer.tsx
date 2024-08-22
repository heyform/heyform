import { applyLogicToFields } from '@heyform-inc/answer-utils'
import {
  ActionEnum,
  FieldKindEnum,
  FormField,
  OTHER_FIELD_KINDS,
  QUESTION_FIELD_KINDS
} from '@heyform-inc/shared-types-enums'
import { helper, nanoid } from '@heyform-inc/utils'
import * as Tooltip from '@radix-ui/react-tooltip'
import clsx from 'clsx'
import type { FC } from 'react'
import { useEffect, useMemo, useReducer, useState } from 'react'

import { ClosedMessage } from './blocks/ClosedMessage'
import { SuspendedMessage } from './blocks/SuspendedMessage'
import type { IState, IStripe } from './store'
import { StoreContext, StoreReducer, getStorage } from './store'
import { getTheme } from './theme'
import type { IFormModel } from './typings'
import { flattenFieldsWithGroups, parseFields, progressPercentage } from './utils'
import { Blocks } from './views/Blocks'
import { Sidebar } from './views/Sidebar'

export interface FormRendererProps {
  className?: string
  form: IFormModel
  locale: string
  query?: Record<string, any>
  stripeApiKey?: string
  stripeAccountId?: string
  autoSave?: boolean
  customUrlRedirects?: boolean
  reportAbuseURL?: string
  alwaysShowNextButton?: boolean
  enableQuestionList?: boolean
  enableNavigationArrows?: boolean
  ssr?: boolean
  onSubmit?: (values: Record<string, any>, isPartial?: boolean, stripe?: IStripe) => Promise<void>
}

function initStore(
  form: IFormModel,
  locale: string,
  autoSave: boolean,
  allowPayment: boolean,
  ssr?: boolean
): IState {
  const list = parseFields(form.fields, form.translations?.[locale])

  const welcomeField = list.find(f => f.kind === FieldKindEnum.WELCOME)
  const thankYouFields = list.filter(f => f.kind === FieldKindEnum.THANK_YOU)

  let allFields = flattenFieldsWithGroups(list.filter(f => !OTHER_FIELD_KINDS.includes(f.kind)))

  if (!allowPayment) {
    allFields = allFields.filter(f => f.kind !== FieldKindEnum.PAYMENT)
  }

  const jumpFieldIds = (form.logics || [])
    .filter(l => l.payloads.some(p => p.action.kind === ActionEnum.NAVIGATE))
    .map(l => l.fieldId)

  const values = getStorage(form.id, autoSave)
  const { fields, variables } = applyLogicToFields(
    [...allFields, ...thankYouFields].filter(Boolean) as FormField[],
    form.logics,
    form.variables,
    values
  )

  const questionCount = fields.filter(f => QUESTION_FIELD_KINDS.includes(f.kind)).length
  const percentage = progressPercentage(Object.keys(values).length, questionCount)

  return {
    // Preventing hydration mismatch errors
    instanceId: ssr ? '' : nanoid(8),
    welcomeField,
    thankYouFields,
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
    theme: getTheme(form.themeSettings?.theme),
    logo: form.themeSettings?.logo
  }
}

export const FormRenderer: FC<FormRendererProps> = ({
  className,
  form,
  locale,
  query = {},
  autoSave = true,
  stripeApiKey,
  stripeAccountId,
  reportAbuseURL,
  alwaysShowNextButton = false,
  customUrlRedirects = false,
  enableQuestionList = false,
  enableNavigationArrows = false,
  ssr = false,
  onSubmit
}) => {
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
      enableQuestionList,
      enableNavigationArrows,
      onSubmit,
      ...initStore(form, locale, autoSave, allowPayment, ssr),
      query
    }),
    [form, locale, autoSave, allowPayment, query]
  )
  const [state, dispatch] = useReducer(StoreReducer, memoState)

  // Form suspended
  if (form.suspended) {
    return <SuspendedMessage />
  }

  // No questions in a form
  else if (!helper.isValidArray(form.fields)) {
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
      <Tooltip.Provider delayDuration={100}>
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
          {enableQuestionList && <Sidebar />}
        </div>
      </Tooltip.Provider>
    </StoreContext.Provider>
  )
}
