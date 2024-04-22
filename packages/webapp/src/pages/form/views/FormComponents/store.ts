import { applyLogicToFields } from '@heyform-inc/answer-utils'
import type {
  FormField,
  FormSettings,
  FormTheme,
  HiddenField,
  Logic,
  Variable
} from '@heyform-inc/shared-types-enums'
import { QUESTION_FIELD_KINDS } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { useContext } from 'react'
import store2 from 'store2'

import { createStoreContext, createStoreReducer } from '@/components/store'
import { IMapType } from '@/components/ui/typing'

import type { IFormField } from './typings'
import { LRU, isFile, progressPercentage, replaceHTML, validateLogicField } from './utils'

// LRU cache for form fields
let LRU_CACHE: LRU

export function getLRU(): LRU {
  if (!LRU_CACHE) {
    LRU_CACHE = new LRU({
      bucket: 'HEYFORM_DATA',
      store: {
        getItem: store2.get.bind(store2),
        setItem: store2.set.bind(store2),
        removeItem: store2.remove.bind(store2)
      }
    })
  }
  return LRU_CACHE
}

export function getStorage(formId: string, autoSave?: boolean) {
  const values: any = {}

  if (autoSave) {
    const cache = getLRU().get(formId)

    if (helper.isValid(cache)) {
      Object.keys(values).forEach(key => {
        const value = values[key]

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
  elements: any
  confirmCardPayment: (clientSecret: string, data?: any, options?: any) => Promise<any>
  apiKey: string
  accountId: string
}

export interface IState {
  formId: string
  welcomeField?: IFormField
  thankYouField?: IFormField
  // Used for logic to reset fields
  allFields: IFormField[]
  fields: IFormField[]
  hiddenFields: HiddenField[]
  translations?: Record<string, any>
  query: Record<string, any>
  jumpFieldIds: string[]
  logics?: Logic[]
  parameters?: Variable[]
  variables: IMapType
  values: IMapType
  // Form settings
  autoSave?: boolean
  settings?: FormSettings
  // Answered progress
  percentage: number
  questionCount: number
  // Scroll params
  scrollIndex?: number
  scrollTo?: ScrollDestination
  isScrollNextDisabled?: boolean
  errorFieldId?: string
  // Is the user ever submitted
  isSubmitTouched?: boolean
  // Start after welcome page
  isStarted?: boolean
  isSubmitted?: boolean
  // Is sidebar open or not
  isSidebarOpen?: boolean
  reportAbuseURL?: string
  // I18n lang
  locale: string
  // Does the plan allows custom url redirects
  customUrlRedirects?: boolean
  alwaysShowNextButton?: boolean
  // Form Theme
  theme: FormTheme
  // Stripe
  stripe?: IStripe
  // Callback functions
  onSubmit?: (values: Record<string, any>, isPartial?: boolean, stripe?: IStripe) => Promise<void>
}

function replaceField(
  field: IFormField,
  values: IMapType,
  fields: IFormField[],
  query: IMapType,
  variables: IMapType
) {
  field.title = replaceHTML(field.title as string, values, fields, query, variables)
  field.description = replaceHTML(field.description as string, values, fields, query, variables)

  return field
}

const actions: any = {
  setValues: (state: IState, { values }: any) => {
    const newValues = {
      ...state.values,
      ...values
    }

    if (state.autoSave) {
      const cache: IMapType = {}

      Object.keys(newValues).forEach(key => {
        const value = newValues[key]

        if (helper.isValid(value) && !isFile(value)) {
          cache[key] = value
        }
      })

      getLRU().put(state.formId, cache)
    }

    const { fields, variables } = applyLogicToFields(
      [...state.allFields, state.thankYouField].filter(Boolean) as FormField[],
      state.logics,
      state.parameters,
      newValues
    )

    // Calculate answered percentage
    const questionCount = fields.filter(f => QUESTION_FIELD_KINDS.includes(f.kind)).length
    // TODO - field ids must contains newValues keys
    const percentage = progressPercentage(Object.keys(newValues).length, questionCount)

    // Determine whether user can scroll to next question or not
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

  setIsSubmitted: (state: IState, { isSubmitted }: any) => ({
    ...state,
    isSubmitted,
    isSidebarOpen: false
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

  init(state: IState) {
    if (!state.isStarted && state.welcomeField) {
      return {
        ...state,
        welcomeField: {
          ...state.welcomeField,
          title: replaceHTML(
            state.welcomeField.title as string,
            state.values,
            state.fields,
            state.query,
            state.variables
          ),
          description: replaceHTML(
            state.welcomeField.description as string,
            state.values,
            state.fields,
            state.query,
            state.variables
          )
        }
      }
    }

    return actions.scrollTo(state, {
      scrollIndex: 0,
      scrollTo: 'next'
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

    return {
      ...state,
      fields,
      scrollIndex,
      scrollTo,
      isScrollNextDisabled: false,
      errorFieldId
    }
  }
}

export const StoreContext = createStoreContext<IState>({
  formId: '',
  allFields: [],
  fields: [],
  hiddenFields: [],
  query: {},
  jumpFieldIds: [],
  values: {},
  variables: {},
  percentage: 0,
  questionCount: 0,
  locale: 'en',
  theme: {}
})

export const StoreReducer = createStoreReducer<IState>(actions, (_, newState) => newState)

export function useStore() {
  return useContext(StoreContext)
}
