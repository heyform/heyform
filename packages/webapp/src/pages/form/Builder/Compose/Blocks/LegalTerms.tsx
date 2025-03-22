import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { FakeRadio } from '../FakeRadio'
import type { BlockProps } from './Block'
import { Block } from './Block'

export const LegalTerms: FC<BlockProps> = ({ field, locale, ...restProps }) => {
  const { t } = useTranslation()

  return (
    <Block className="heyform-legal-terms" field={field} locale={locale} {...restProps}>
      <div className="heyform-radio-group w-56">
        <FakeRadio hotkey="Y" label={t('I accept', { lng: locale })} />
        <FakeRadio hotkey="N" label={t("I don't accept", { lng: locale })} />
      </div>
    </Block>
  )
}
