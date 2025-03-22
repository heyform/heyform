import { IconChevronRight } from '@tabler/icons-react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { FakeSubmit } from '../FakeSubmit'
import type { BlockProps } from './Block'
import { Block } from './Block'

export const Email: FC<BlockProps> = ({ field, locale, ...restProps }) => {
  const { t } = useTranslation()

  return (
    <Block className="heyform-email" field={field} locale={locale} {...restProps}>
      <input
        type="email"
        className="heyform-input"
        placeholder="email@example.com"
        disabled={true}
      />
      <FakeSubmit text={t('Next', { lng: locale })} icon={<IconChevronRight />} />
    </Block>
  )
}
