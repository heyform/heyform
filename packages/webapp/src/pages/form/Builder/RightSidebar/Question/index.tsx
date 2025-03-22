import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useStoreContext } from '../../store'
import CoverAndLayout from './CoverAndLayout'
import DateSettings from './Date'
import MultipleChoiceSettings from './MultipleChoice'
import OpinionScaleSettings from './OpinionScale'
import PaymentSettings from './Payment'
import PhoneNumberSettings from './PhoneNumber'
import RatingSettings from './Rating'
import RequiredSettings, { RequiredSettingsProps } from './Required'
import StatementSettings from './Statement'
import ThankYouSettings from './ThankYou'
import TypeSwitcher from './TypeSwitcher'

const Settings = ({ field }: RequiredSettingsProps) => {
  const children = useMemo(() => {
    switch (field.kind) {
      case FieldKindEnum.DATE:
      case FieldKindEnum.DATE_RANGE:
        return <DateSettings field={field} />

      case FieldKindEnum.MULTIPLE_CHOICE:
      case FieldKindEnum.PICTURE_CHOICE:
        return <MultipleChoiceSettings field={field} />

      case FieldKindEnum.OPINION_SCALE:
        return <OpinionScaleSettings field={field} />

      case FieldKindEnum.PHONE_NUMBER:
        return <PhoneNumberSettings field={field} />

      case FieldKindEnum.RATING:
        return <RatingSettings field={field} />

      case FieldKindEnum.STATEMENT:
      case FieldKindEnum.GROUP:
      case FieldKindEnum.WELCOME:
        return <StatementSettings field={field} />

      case FieldKindEnum.THANK_YOU:
        return <ThankYouSettings field={field} />

      case FieldKindEnum.PAYMENT:
        return <PaymentSettings field={field} />

      default:
        return null
    }
  }, [field])

  return (
    <div className="mt-3 space-y-2">
      <RequiredSettings field={field} />
      {children}
    </div>
  )
}

export default function Question() {
  const { t } = useTranslation()
  const { state } = useStoreContext()

  if (!state.currentField) {
    return null
  }

  return (
    <div className="p-4">
      {/* Change question type */}
      <TypeSwitcher />

      {/* Settings */}
      <div className="mb-4 border-b border-accent-light pb-4">
        <div className="text-sm/6 font-medium">{t('form.builder.settings.title')}</div>
        <Settings field={state.currentField} />
      </div>

      {/* Cover layout */}
      <CoverAndLayout />
    </div>
  )
}
