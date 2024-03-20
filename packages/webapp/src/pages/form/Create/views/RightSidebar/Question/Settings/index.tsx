import { FieldKindEnum, QUESTION_FIELD_KINDS } from '@heyform-inc/shared-types-enums'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { useStoreContext } from '@/pages/form/Create/store'

import { Basic } from './Basic'
import { Date } from './Date'
import { MultipleChoice } from './MultipleChoice'
import { OpinionScale } from './OpinionScale'
import { Payment } from './Payment'
import { PhoneNumber } from './PhoneNumber'
import { Rating } from './Rating'
import { Statement } from './Statement'
import { ThankYou } from './ThankYou'

export const Settings: FC = () => {
  const { t } = useTranslation()
  const { state } = useStoreContext()
  const field = state.selectedField!

  return (
    <div className="right-sidebar-group right-sidebar-settings">
      <div className="right-sidebar-group-title">{t('formBuilder.settings')}</div>

      {QUESTION_FIELD_KINDS.includes(field.kind) && field.kind !== FieldKindEnum.GROUP && (
        <Basic field={field} />
      )}

      {(() => {
        switch (field.kind) {
          case FieldKindEnum.DATE:
          case FieldKindEnum.DATE_RANGE:
            return <Date field={field} />

          case FieldKindEnum.MULTIPLE_CHOICE:
          case FieldKindEnum.PICTURE_CHOICE:
            return <MultipleChoice field={field} />

          case FieldKindEnum.OPINION_SCALE:
            return <OpinionScale field={field} />

          case FieldKindEnum.PHONE_NUMBER:
            return <PhoneNumber field={field} />

          case FieldKindEnum.RATING:
            return <Rating field={field} />

          case FieldKindEnum.STATEMENT:
          case FieldKindEnum.GROUP:
          case FieldKindEnum.WELCOME:
            return <Statement field={field} />

          case FieldKindEnum.THANK_YOU:
            return <ThankYou field={field} />

          case FieldKindEnum.PAYMENT:
            return <Payment field={field} />
        }
      })()}
    </div>
  )
}
