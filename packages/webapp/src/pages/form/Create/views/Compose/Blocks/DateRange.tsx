import { IconChevronRight } from '@tabler/icons-react'
import clsx from 'clsx'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { DATE_FORMAT_MAPS, TIME_FORMAT } from '@/pages/form/Create/consts'
import { DateItem } from '@/pages/form/Create/views/Compose/Blocks/Date'
import { FakeSubmit } from '@/pages/form/Create/views/Compose/FakeSubmit'

import type { BlockProps } from './Block'
import { Block } from './Block'

export const DateRange: FC<BlockProps> = ({ field, locale, ...restProps }) => {
  const { t } = useTranslation()
  const format = field.properties?.format || 'MM/DD/YYYY'
  const [x, y, z, dateDivider] = DATE_FORMAT_MAPS[format]
  const [h, m, timeDivider] = DATE_FORMAT_MAPS[TIME_FORMAT]

  return (
    <Block className="heyform-date" field={field} locale={locale} {...restProps}>
      <div
        className={clsx('heyform-date-range flex items-center', {
          'heyform-date-range-with-time': field.properties?.allowTime
        })}
      >
        <div className="heyform-date-root heyform-start-date">
          <DateItem format={x} locale={locale} />
          <div className="heyform-date-divider">{dateDivider}</div>
          <DateItem format={y} locale={locale} />
          <div className="heyform-date-divider">{dateDivider}</div>
          <DateItem format={z} locale={locale} />

          {field.properties?.allowTime && (
            <>
              <DateItem format={h} locale={locale} />
              <div className="heyform-date-divider">{timeDivider}</div>
              <DateItem format={m} locale={locale} />
            </>
          )}
        </div>

        <div className="heyform-date-range-divider">{t('formBuilder.dateRangeTo')}</div>

        <div className="heyform-date-root heyform-end-date">
          <DateItem format={x} locale={locale} />
          <div className="heyform-date-divider">{dateDivider}</div>
          <DateItem format={y} locale={locale} />
          <div className="heyform-date-divider">{dateDivider}</div>
          <DateItem format={z} locale={locale} />

          {field.properties?.allowTime && (
            <>
              <DateItem format={h} locale={locale} />
              <div className="heyform-date-divider">{timeDivider}</div>
              <DateItem format={m} locale={locale} />
            </>
          )}
        </div>
      </div>

      <FakeSubmit text={t('Next', { lng: locale })} icon={<IconChevronRight />} />
    </Block>
  )
}
