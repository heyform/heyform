import { FieldKindEnum, FormField } from '@heyform-inc/shared-types-enums'
import type { FC } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useTranslation } from '../utils'

import { Address } from '../blocks/Address'
import { ChoiceMatrix } from '../blocks/ChoiceMatrix'
import { Country } from '../blocks/Country'
import { Date } from '../blocks/Date'
import { DateRange } from '../blocks/DateRange'
import { Email } from '../blocks/Email'
import { FileUpload } from '../blocks/FileUpload'
import { FullName } from '../blocks/FullName'
import { InputTable } from '../blocks/InputTable'
import { LegalTerms } from '../blocks/LegalTerms'
import { LongText } from '../blocks/LongText'
import { MultipleChoice } from '../blocks/MultipleChoice'
import { Number } from '../blocks/Number'
import { OpinionScale } from '../blocks/OpinionScale'
import { Payment } from '../blocks/Payment'
import { PhoneNumber } from '../blocks/PhoneNumber'
import { PictureChoice } from '../blocks/PictureChoice'
import { Rating } from '../blocks/Rating'
import { ShortText } from '../blocks/ShortText'
import { Signature } from '../blocks/Signature'
import { Statement } from '../blocks/Statement'
import { ThankYou } from '../blocks/ThankYou'
import { Website } from '../blocks/Website'
import { Welcome } from '../blocks/Welcome'
import { YesNo } from '../blocks/YesNo'
import { useStore } from '../store'
import { Footer } from './Footer'
import { Header } from './Header'

const QUESTION_TRANSITION_DURATION = 1000
type TransitionState = 'active' | 'leaving'

function getBlock(
  field: FormField,
  blockIndex?: number,
  transitionState: TransitionState = 'active'
) {
  switch (field.kind) {
    case FieldKindEnum.ADDRESS:
      return <Address key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.COUNTRY:
      return <Country key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.FULL_NAME:
      return <FullName key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.DATE:
      return <Date key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.DATE_RANGE:
      return <DateRange key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.EMAIL:
      return <Email key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.FILE_UPLOAD:
      return <FileUpload key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.MULTIPLE_CHOICE:
      return <MultipleChoice key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.NUMBER:
      return <Number key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.OPINION_SCALE:
      return <OpinionScale key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.PHONE_NUMBER:
      return <PhoneNumber key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.PICTURE_CHOICE:
      return <PictureChoice key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.RATING:
      return <Rating key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.URL:
      return <Website key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.YES_NO:
      return <YesNo key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.LONG_TEXT:
      return <LongText key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.SIGNATURE:
      return <Signature key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.LEGAL_TERMS:
      return <LegalTerms key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.CHOICE_MATRIX:
      return <ChoiceMatrix key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.INPUT_TABLE:
      return <InputTable key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.SHORT_TEXT:
      return <ShortText key={field.id} field={field} transitionState={transitionState} />

    case FieldKindEnum.PAYMENT:
      return (
        <Payment
          key={field.id}
          field={field}
          paymentBlockIndex={blockIndex}
          transitionState={transitionState}
        />
      )

    default:
      return <Statement key={field.id} field={field} transitionState={transitionState} />
  }
}

const Main: FC = () => {
  const { state } = useStore()
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [leavingField, setLeavingField] = useState<{
    field: FormField
    key: string
  }>()
  const previousFieldRef = useRef<FormField | undefined>(undefined)
  const paymentIndex = useMemo(
    () => state.fields.findIndex(field => field.kind === FieldKindEnum.PAYMENT),
    [state.fields]
  )
  const paymentField = useMemo(
    () => (paymentIndex > -1 ? state.fields[paymentIndex] : undefined),
    [paymentIndex, state.fields]
  )
  const activeField = useMemo(
    () => state.fields[state.scrollIndex!],
    [state.fields, state.scrollIndex]
  )

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      setIsReducedMotion(false)
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setIsReducedMotion(mediaQuery.matches)

    update()
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update)
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(update)
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', update)
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(update)
      }
    }
  }, [])

  useEffect(() => {
    if (!activeField) {
      previousFieldRef.current = activeField
      return
    }

    const previousField = previousFieldRef.current
    previousFieldRef.current = activeField

    if (
      !previousField ||
      previousField.id === activeField.id ||
      previousField.kind === FieldKindEnum.PAYMENT
    ) {
      return
    }

    if (isReducedMotion) {
      setLeavingField(undefined)
      return
    }

    setLeavingField({
      field: previousField,
      key: `${previousField.id}-${window.Date.now()}`
    })

    const timeoutId = window.setTimeout(() => {
      setLeavingField(undefined)
    }, QUESTION_TRANSITION_DURATION)

    return () => window.clearTimeout(timeoutId)
  }, [activeField, isReducedMotion, state.scrollTo])

  const activeBlock = useMemo(() => {
    if (!activeField || activeField.kind === FieldKindEnum.PAYMENT) {
      return null
    }

    return getBlock(activeField)
  }, [activeField])

  const leavingBlock = useMemo(() => {
    if (!leavingField) {
      return null
    }

    return <div key={leavingField.key}>{getBlock(leavingField.field, undefined, 'leaving')}</div>
  }, [leavingField])

  const persistentPaymentBlock = useMemo(() => {
    if (!paymentField) {
      return null
    }

    return getBlock(paymentField, paymentIndex)
  }, [paymentField, paymentIndex])

  if (!activeField) {
    return null
  }

  if (paymentField) {
    const isCurrentBeforePayment = state.scrollIndex! < paymentIndex

    return (
      <>
        {isCurrentBeforePayment && activeBlock}
        {persistentPaymentBlock}
        {!isCurrentBeforePayment && activeBlock}
        {leavingBlock}
      </>
    )
  }

  return (
    <>
      {activeBlock}
      {leavingBlock}
    </>
  )
}

export const Blocks = () => {
  const { state } = useStore()
  const { t } = useTranslation()

  function handleResize() {
    if (window.heyform.device.android) {
      document.activeElement?.scrollIntoView()
    }
  }

  useEffect(() => {
    window.addEventListener('resize', handleResize, false)

    return () => {
      window.removeEventListener('resize', handleResize, false)
    }
  }, [])

  if (!state.isStarted && state.welcomeField) {
    return <Welcome field={state.welcomeField} />
  }

  if (state.isSubmitted) {
    const thankYouField = state.thankYouFields?.find(f => f.id === state.thankYouFieldId)

    const field: any = thankYouField || {
      title: t('Thank you!'),
      description: t('Thanks for completing this form. Now create your own form.'),
      properties: {
        buttonText: t('Create a heyform')
      }
    }

    return <ThankYou field={field} />
  }

  return (
    <>
      <Header />
      <Main />
      <Footer />
    </>
  )
}
