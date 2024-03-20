import { IconChevronRight } from '@tabler/icons-react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { FakeSubmit } from '@/pages/form/Create/views/Compose/FakeSubmit'

import { FakeSelect } from '../FakeSelect'
import type { BlockProps } from './Block'
import { Block } from './Block'

export const Address: FC<BlockProps> = ({ field, locale, ...restProps }) => {
  const { t } = useTranslation()

  return (
    <Block className="heyform-address" field={field} locale={locale} {...restProps}>
      <div className="space-y-4">
        <input
          type="text"
          className="heyform-input"
          placeholder={t('Address Line 1', { lng: locale })}
          disabled={true}
        />
        <input
          type="text"
          className="heyform-input"
          placeholder={t('Address Line 2 (optional)', { lng: locale })}
          disabled={true}
        />

        <div className="flex items-center space-x-4">
          <input
            type="text"
            className="heyform-input"
            placeholder={t('City', { lng: locale })}
            disabled={true}
          />
          <input
            type="text"
            className="heyform-input"
            placeholder={t('State/Province', { lng: locale })}
            disabled={true}
          />
        </div>

        <div className="flex items-center space-x-4">
          <input
            type="text"
            className="heyform-input"
            placeholder={t('Zip/Postal Code', { lng: locale })}
            disabled={true}
          />
          <FakeSelect />
        </div>
      </div>
      <FakeSubmit text={t('Next', { lng: locale })} icon={<IconChevronRight />} />
    </Block>
  )
}
