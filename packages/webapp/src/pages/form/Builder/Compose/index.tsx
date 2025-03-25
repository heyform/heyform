import { insertWebFont } from '@heyform-inc/form-renderer'
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { FC, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { useOnboardingStorage, useToast } from '@/components'
import { ADD_QUESTION2_STORAGE_NAME } from '@/consts'
import { FormService } from '@/services'
import { useFormStore } from '@/store'
import { cn, useParam } from '@/utils'

import { useStoreContext } from '../store'
import { getFilteredFields, insertThemeStyle } from '../utils'
import { Queue } from '../utils/queue'
import {
  Address,
  Country,
  Date,
  DateRange,
  Email,
  FileUpload,
  FullName,
  InputTable,
  LegalTerms,
  LongText,
  MultipleChoice,
  Number,
  OpinionScale,
  Payment,
  PhoneNumber,
  PictureChoice,
  Rating,
  ShortText,
  Signature,
  Statement,
  ThankYou,
  Website,
  Welcome,
  YesNo
} from './Blocks'

const Fields: FC = () => {
  const { state } = useStoreContext()
  const field = state.currentField

  if (!field) {
    return null
  }

  const parentField = state.parentField

  switch (field.kind) {
    case FieldKindEnum.ADDRESS:
      return (
        <Address key={field.id} field={field} locale={state.locale} parentField={parentField} />
      )

    case FieldKindEnum.COUNTRY:
      return (
        <Country key={field.id} field={field} locale={state.locale} parentField={parentField} />
      )

    case FieldKindEnum.DATE:
      return <Date key={field.id} field={field} locale={state.locale} parentField={parentField} />

    case FieldKindEnum.DATE_RANGE:
      return (
        <DateRange key={field.id} field={field} locale={state.locale} parentField={parentField} />
      )

    case FieldKindEnum.EMAIL:
      return <Email key={field.id} field={field} locale={state.locale} parentField={parentField} />

    case FieldKindEnum.FILE_UPLOAD:
      return (
        <FileUpload key={field.id} field={field} locale={state.locale} parentField={parentField} />
      )

    case FieldKindEnum.FULL_NAME:
      return (
        <FullName key={field.id} field={field} locale={state.locale} parentField={parentField} />
      )

    case FieldKindEnum.INPUT_TABLE:
      return (
        <InputTable key={field.id} field={field} locale={state.locale} parentField={parentField} />
      )

    case FieldKindEnum.LEGAL_TERMS:
      return (
        <LegalTerms key={field.id} field={field} locale={state.locale} parentField={parentField} />
      )

    case FieldKindEnum.LONG_TEXT:
      return (
        <LongText key={field.id} field={field} locale={state.locale} parentField={parentField} />
      )

    case FieldKindEnum.MULTIPLE_CHOICE:
      return (
        <MultipleChoice
          key={field.id}
          field={field}
          locale={state.locale}
          parentField={parentField}
        />
      )

    case FieldKindEnum.NUMBER:
      return <Number key={field.id} field={field} locale={state.locale} parentField={parentField} />

    case FieldKindEnum.OPINION_SCALE:
      return (
        <OpinionScale
          key={field.id}
          field={field}
          locale={state.locale}
          parentField={parentField}
        />
      )

    case FieldKindEnum.PHONE_NUMBER:
      return (
        <PhoneNumber key={field.id} field={field} locale={state.locale} parentField={parentField} />
      )

    case FieldKindEnum.PICTURE_CHOICE:
      return (
        <PictureChoice
          key={field.id}
          field={field}
          locale={state.locale}
          parentField={parentField}
        />
      )

    case FieldKindEnum.RATING:
      return <Rating key={field.id} field={field} locale={state.locale} parentField={parentField} />

    case FieldKindEnum.SHORT_TEXT:
      return (
        <ShortText key={field.id} field={field} locale={state.locale} parentField={parentField} />
      )

    case FieldKindEnum.SIGNATURE:
      return (
        <Signature key={field.id} field={field} locale={state.locale} parentField={parentField} />
      )

    case FieldKindEnum.URL:
      return (
        <Website key={field.id} field={field} locale={state.locale} parentField={parentField} />
      )

    case FieldKindEnum.YES_NO:
      return <YesNo key={field.id} field={field} locale={state.locale} parentField={parentField} />

    case FieldKindEnum.WELCOME:
      return (
        <Welcome key={field.id} field={field} locale={state.locale} parentField={parentField} />
      )

    case FieldKindEnum.THANK_YOU:
      return (
        <ThankYou key={field.id} field={field} locale={state.locale} parentField={parentField} />
      )

    case FieldKindEnum.PAYMENT:
      return (
        <Payment key={field.id} field={field} locale={state.locale} parentField={parentField} />
      )

    default:
      return (
        <Statement key={field.id} field={field} locale={state.locale} parentField={parentField} />
      )
  }
}

export default function BuilderCompose() {
  const { t } = useTranslation()

  const { formId } = useParam()
  const toast = useToast()
  const { state, dispatch } = useStoreContext()
  const { form, themeSettings, updateForm } = useFormStore()
  const { setItem } = useOnboardingStorage()

  const queue = useRef(new Queue()).current

  const sync = useCallback(async () => {
    try {
      const { fields } = getFilteredFields(state.fields!)

      const result = await FormService.updateFormSchemas({
        formId,
        version: form?.version as number,
        drafts: fields
      })

      updateForm(result)
    } catch (err: any) {
      toast({
        title: t('components.error.title'),
        message: err.message
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, state.fields, form?.version])

  queue.on(event => {
    switch (event) {
      case 'start':
        dispatch({
          type: 'setSyncing',
          payload: {
            isSyncing: true
          }
        })
        queue.sync(sync)
        break

      case 'complete':
      case 'failed':
        dispatch({
          type: 'setSyncing',
          payload: {
            isSyncing: false
          }
        })
        break
    }
  })

  useEffect(() => {
    insertWebFont(themeSettings?.theme?.fontFamily)
    insertThemeStyle(themeSettings?.theme)
  }, [themeSettings?.theme])

  // Auto save
  useEffect(() => {
    if (state.version > 0) {
      setItem(ADD_QUESTION2_STORAGE_NAME, true)
      queue.add()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.version])

  useEffect(() => {
    return () => {
      queue.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={cn('compose', {
        'compose-mobile': window.heyform.device.mobile
      })}
    >
      <div className="heyform-root">
        <div className="heyform-wrapper">
          <div className="heyform-header">
            <div className="heyform-header-wrapper">
              <div className="heyform-header-left"></div>
              <div className="heyform-header-right"></div>
            </div>
          </div>

          <div className="compose-container heyform-body">
            <Fields />
          </div>
        </div>
      </div>
    </div>
  )
}
