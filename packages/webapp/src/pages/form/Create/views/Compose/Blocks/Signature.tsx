import { IconChevronRight } from '@tabler/icons-react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { FakeSubmit } from '@/pages/form/Create/views/Compose/FakeSubmit'

import type { BlockProps } from './Block'
import { Block } from './Block'

export const Signature: FC<BlockProps> = ({ field, locale, ...restProps }) => {
  const { t } = useTranslation()

  return (
    <Block className="heyform-signature" field={field} locale={locale} {...restProps}>
      <div className="heyform-signature-wrapper"></div>
      <div className="heyform-signature-bottom">
        <span>{t('Draw your signature above', { lng: locale })}</span>
        <span>{t('Clear', { lng: locale })}</span>
      </div>
      <FakeSubmit text={t('Next', { lng: locale })} icon={<IconChevronRight />} />
    </Block>
  )
}
