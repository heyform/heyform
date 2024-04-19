import type { FC } from 'react'

import { useTranslation } from '../utils'

interface SelectHelperProps {
  min: number
  max: number
}

export const SelectHelper: FC<SelectHelperProps> = ({ min = 0, max = 0 }) => {
  const { t } = useTranslation()

  if (max === 1 || (min === max && min === 0)) {
    return null
  }

  if (min === 0) {
    return <div className="heyform-select-helper">{t('Choose up to {{max}} choices', { max })}</div>
  } else {
    if (max === 0) {
      return (
        <div className="heyform-select-helper">{t('Choose at least {{min}} choices', { min })}</div>
      )
    }
  }

  if (max === min) {
    return <div className="heyform-select-helper">{t('Choose {{max}} choices', { max })}</div>
  }

  return (
    <div className="heyform-select-helper">
      {t('Choose between {{min}} to {{max}} choices', { min, max })}
    </div>
  )
}
