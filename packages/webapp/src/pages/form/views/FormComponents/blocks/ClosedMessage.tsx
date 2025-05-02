import { FormModel } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { FC } from 'react'

import { useTranslation } from '../utils'
import { ThankYou } from './ThankYou'

interface ClosedMessageProps {
  form: FormModel
}

export const ClosedMessage: FC<ClosedMessageProps> = ({ form }) => {
  const { t } = useTranslation()
  const { settings } = form

  const field: any = {
    title: t('Form unavailable'),
    description: t("The form can't receive new submissions now."),
    properties: {
      buttonText: t('Create a heyform')
    }
  }

  if (settings?.active !== true && settings?.enableClosedMessage) {
    if (helper.isValid(settings.closedFormTitle)) {
      field.title = settings.closedFormTitle
    }

    if (helper.isValid(settings.closedFormDescription)) {
      field.description = settings.closedFormDescription
    }
  }

  return <ThankYou field={field} />
}
