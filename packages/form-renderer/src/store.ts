import type {
  FormField,
  FormSettings,
  FormTheme,
  HiddenField,
  Logic,
  Variable
} from '@heyform-inc/shared-types-enums'
import { useContext } from 'react'

import {
  LRU,
  LRUMemoryStore,
  calculateProgress,
  createStoreContext,
  createStoreReducer,
  isFile,
  replaceHTML,
  validateLogicField
} from './utils'
import { applyLogicToFields } from '@heyform-inc/answer-utils'
import { helper } from '@heyform-inc/utils'

import type { AnyMap, IFormField } from './typings'

let LRU_CACHE: LRU

function removeLegacyLocalStorage(): void {
  if (typeof window === 'undefined') {
    return
  }

  // Versions before this hardening pass stored answer data in localStorage for seven days.
  // Purge that bucket whenever a renderer initializes, even though autosave now defaults off.
  try {
    window.localStorage.removeItem('HEYFORM_DATA')
  } catch {}
}

function getSessionStore() {
  if (typeof window === 'undefined') {
    return new LRUMemoryStore()
  }

  return {
    getItem(key: string) {
      try {
        const value = window.sessionStorage.getItem(key)
        return value ? JSON.parse(value) : undefined
      } catch {
        return undefined
      }
    },
    setItem(key: string, value: unknown) {
      try {
        window.sessionStorage.setItem(key, JSON.stringify(value))
      } catch {}
    },
    removeItem(key: string) {
      try {
        window.sessionStorage.removeItem(key)
      } catch {}
    }
  }
}

export function getLRU(): LRU {
  if (!LRU_CACHE) {
    LRU_CACHE = new LRU({
      bucket: 'HEYFORM_SESSION_DATA',
      expires: 60 * 60,
      store: getSessionStore()
    })
  }
  return LRU_CACHE
}

export function getStorage(formId: string, autoSave?: boolean) {
  const values: any = {}

  removeLegacyLocalStorage()

  if (autoSave) {
    const cache = getLRU().get(formId)

    if (helper.isValid(cache)) {
      Object.keys(cache).forEach(key => {
        const value = cache[key]

        if (helper.isValid(value)) {
          values[key] = value
        }
      })
    }
  }

  return values
}

export function removeStorage(formId: string) {
  getLRU().remove(formId)
}

export type ScrollDestination = 'next' | 'previous' | string

export interface IStripe {
  elements: stripe.elements.Elements
  confirmCardPayment: (
    clientSecret: string,
    data?: stripe.ConfirmCardPaymentData,
    options?: stripe.ConfirmCardPaymentOptions
  ) => Promise<stripe.PaymentIntentResponse>
  apiKey: string
  accountId: string
}

export interface IState {
  formId: string
  instanceId: string
  welcomeField?: IFormField
  thankYouFieldId?: string
  thankYouFields: IFormField[]
  allFields: IFormField[]
  fields: IFormField[]
  hiddenFields: HiddenField[]
  translations?: Record<string, any>
  query: Record<string, any>
  jumpFieldIds: string[]
  logics?: Logic[]
  parameters?: Variable[]
  variables: AnyMap
  values: AnyMap
  autoSave?: boolean
  settings?: FormSettings
  percentage: number
  questionCount: number
  passedFieldIds: string[]
  scrollIndex?: number
  scrollTo?: ScrollDestination
  isScrollNextDisabled?: boolean
  errorFieldId?: string
  isSubmitTouched?: boolean
  isStarted?: boolean
  isSubmitted?: boolean
  isSidebarOpen?: boolean
  reportAbuseURL?: string
  locale: string
  customUrlRedirects?: boolean
  alwaysShowNextButton?: boolean
  enableQuestionList?: boolean
  enableNavigationArrows?: boolean
  logo?: string
  theme: FormTheme
  stripe?: IStripe
  onSubmit?: (values: Record<string, any>, isPartial?: boolean, stripe?: IStripe) => Promise<void>
}

const actions: any = {
  setValues: (state: IState, { values }: any) => {
    const newValues = {
      ...state.values,
      ...values
    }

    if (state.autoSave) {
      const cache: AnyMap = {}

      Object.keys(newValues).forEach(key => {
        const value = newValues[key]

        if (helper.isValid(value) && !isFile(value)) {
          cache[key] = value
        }
      })

      getLRU().put(state.formId, cache)
    }

    const { fields, variables } = applyLogicToFields(
      [...state.allFields, ...state.thankYouFields].filter(Boolean) as FormField[],
      state.logics,
      state.parameters,
      newValues
    )

    const { questionCount, percentage } = calculateProgress(fields, newValues, state.passedFieldIds)

    const isTouched = validateLogicField(fields[state.scrollIndex!], state.jumpFieldIds, values)
    const isScrollNextDisabled = !isTouched || state.scrollIndex! >= fields.length - 1

    return {
      ...state,
      fields,
      values: newValues,
      variables,
      percentage,
      questionCount,
      isScrollNextDisabled
    }
  },

  setIsStarted: (state: IState, { isStarted }: any) => {
    return actions.scrollTo(
      {
        ...state,
        isStarted,
        isSubmitted: state.fields.length < 1
      },
      {
        scrollIndex: 0,
        scrollTo: 'next'
      }
    )
  },

  setIsSubmitTouched: (state: IState, { isSubmitTouched }: any) => ({ ...state, isSubmitTouched }),

  setIsSubmitted: (state: IState, { isSubmitted, thankYouFieldId }: any) => ({
    ...state,
    isSubmitted,
    isSidebarOpen: false,
    thankYouFieldId
  }),

  setIsSidebarOpen: (state: IState, { isSidebarOpen }: any) => ({ ...state, isSidebarOpen }),

  setStripe: (state: IState, { stripe }: any) => ({ ...state, stripe }),

  resetErrorField: (state: IState) => ({ ...state, errorFieldId: undefined }),

  scrollPrevious: (state: IState) => {
    if (state.scrollIndex! < 1) {
      return state
    }

    return actions.scrollTo(state, {
      scrollIndex: state.scrollIndex! - 1,
      scrollTo: 'previous'
    })
  },

  scrollNext: (state: IState) => {
    const { scrollIndex, fields, values, jumpFieldIds } = state
    const isTouched = validateLogicField(fields[scrollIndex!], jumpFieldIds, values)

    if (!isTouched || scrollIndex! >= fields.length - 1) {
      return {
        ...state,
        isScrollNextDisabled: true
      }
    }

    return actions.scrollTo(state, {
      scrollIndex: scrollIndex! + 1,
      scrollTo: 'next'
    })
  },

  scrollToField(state: IState, { fieldId, errorFieldId }: any) {
    const index = state.fields.findIndex(f => f.id === fieldId)

    if (index < 0) {
      return state
    }

    return actions.scrollTo(state, {
      scrollIndex: index,
      scrollTo:
        !helper.isNil(state.scrollIndex) && index >= state.scrollIndex! ? 'next' : 'previous',
      errorFieldId
    })
  },

  scrollTo(state: IState, { scrollIndex, scrollTo, errorFieldId }: any) {
    const { fields, values, variables } = state
    const field = fields[scrollIndex]

    field.title = replaceHTML(field.title as string, values, fields, state.query, variables)
    field.description = replaceHTML(
      field.description as string,
      values,
      fields,
      state.query,
      variables
    )

    // Empty when moving backwards, and spans every question a question list jump skips over.
    const passedFields = fields.slice(state.scrollIndex, scrollIndex)
    const passedFieldIds = [...new Set([...state.passedFieldIds, ...passedFields.map(f => f.id)])]
    const { questionCount, percentage } = calculateProgress(fields, values, passedFieldIds)

    return {
      ...state,
      fields,
      passedFieldIds,
      percentage,
      questionCount,
      scrollIndex,
      scrollTo,
      isScrollNextDisabled: false,
      errorFieldId
    }
  }
}

export const StoreContext = createStoreContext<IState>({
  instanceId: '',
  formId: '',
  allFields: [],
  fields: [],
  thankYouFields: [],
  hiddenFields: [],
  query: {},
  jumpFieldIds: [],
  values: {},
  variables: {},
  percentage: 0,
  questionCount: 0,
  passedFieldIds: [],
  locale: 'en',
  theme: {}
})

export const StoreReducer = createStoreReducer<IState>(actions, (_, newState) => newState)

export function useStore() {
  return useContext(StoreContext)
}
