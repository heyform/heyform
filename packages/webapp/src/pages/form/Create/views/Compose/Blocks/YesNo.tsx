import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { FakeRadio } from '../FakeRadio'
import type { BlockProps } from './Block'
import { Block } from './Block'

export const YesNo: FC<BlockProps> = ({ field, locale, ...restProps }) => {
  const { t } = useTranslation()

  return (
    <Block className="heyform-yes-no" field={field} locale={locale} {...restProps}>
      <div className="heyform-radio-group w-40">
        <FakeRadio hotkey="Y" label={t('Yes', { lng: locale })} />
        <FakeRadio hotkey="N" label={t('No', { lng: locale })} />
      </div>
    </Block>
  )
}
