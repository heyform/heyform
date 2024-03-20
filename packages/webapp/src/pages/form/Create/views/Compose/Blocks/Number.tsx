import { IconChevronRight } from '@tabler/icons-react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { FakeSubmit } from '@/pages/form/Create/views/Compose/FakeSubmit'

import type { BlockProps } from './Block'
import { Block } from './Block'

export const Number: FC<BlockProps> = ({ field, locale, ...restProps }) => {
  const { t } = useTranslation()

  return (
    <Block className="heyform-number" field={field} locale={locale} {...restProps}>
      <input
        type="number"
        className="heyform-input"
        placeholder={t('Your answer goes here', { lng: locale })}
        disabled={true}
      />
      <FakeSubmit text={t('Next', { lng: locale })} icon={<IconChevronRight />} />
    </Block>
  )
}
