import { IconChevronRight } from '@tabler/icons-react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { FakeSubmit } from '../FakeSubmit'
import type { BlockProps } from './Block'
import { Block } from './Block'

export const FullName: FC<BlockProps> = ({ field, locale, ...restProps }) => {
  const { t } = useTranslation()

  return (
    <Block className="heyform-full-name" field={field} locale={locale} {...restProps}>
      <div className="flex items-center space-x-4">
        <input
          type="text"
          className="heyform-input"
          placeholder={t('First Name', { lng: locale })}
          disabled={true}
        />
        <input
          type="text"
          className="heyform-input"
          placeholder={t('Last Name', { lng: locale })}
          disabled={true}
        />
      </div>
      <FakeSubmit text={t('Next', { lng: locale })} icon={<IconChevronRight />} />
    </Block>
  )
}
