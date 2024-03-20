import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import type { FC } from 'react'

import { useStoreContext } from '@/pages/form/Create/store'

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
  const field = state.selectedField

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

export const Compose = () => {
  return (
    <div className="compose heyform-wrapper">
      <div className="compose-container heyform-body">
        <Fields />
      </div>
    </div>
  )
}
