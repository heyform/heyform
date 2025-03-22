import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Select } from '@/components'
import { LOCALE_OPTIONS } from '@/consts'

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  const options = useMemo(
    () =>
      LOCALE_OPTIONS.map(l => ({
        value: l.value,
        label: (
          <div>
            <div className="text-sm/[1.4rem] font-medium text-primary" data-slot="label">
              {t(l.label)}
            </div>
            <div className="text-xs text-secondary" data-slot="translated">
              {t(l.translated)}
            </div>
          </div>
        )
      })),
    [t]
  )

  return (
    <Select
      className="[&_[data-slot=translated]]:hidden"
      contentProps={{
        className: '!w-48',
        position: 'popper'
      }}
      value={i18n.language}
      options={options}
      onChange={i18n.changeLanguage}
    />
  )
}
