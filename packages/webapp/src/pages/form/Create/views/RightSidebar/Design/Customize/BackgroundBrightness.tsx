import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { Slider } from '@/components/ui'

interface BackgroundBrightnessProps {
  backgroundImage?: string
  value?: number
  onChange?: (value?: number) => void
}

export const BackgroundBrightness: FC<BackgroundBrightnessProps> = ({
  backgroundImage,
  value,
  onChange
}) => {
	const { t } = useTranslation()
  function handleChange(newValue: any) {
    onChange?.(newValue)
  }

  return (
    <div className="background-brightness flex items-end justify-between">
      <img className="background-brightness-image" src={backgroundImage} />
      <div className="ml-4 flex-1">
        <div className="mb-2">{t('formBuilder.brightness')}</div>
        <Slider min={-100} max={100} value={value} onChange={handleChange} />
      </div>
    </div>
  )
}
