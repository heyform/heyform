import { helper } from '@heyform-inc/utils'
import { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Image, Slider } from '@/components'

export interface ImageBrightnessProps {
  imageURL?: string
  value?: any
  onChange?: (value?: any) => void
}

export function getBrightnessStyle(brightness: number) {
  const value = 1 + brightness / 100

  if (value < 0) {
    return {
      filter: `brightness(${value})`
    }
  }

  return {
    filter: `contrast(${2 - value}) brightness(${value})`
  }
}

const ImageBrightness: FC<ImageBrightnessProps> = ({ imageURL, value, onChange }) => {
  const { t } = useTranslation()
  const isImage = useMemo(() => helper.isURL(imageURL), [imageURL])

  function handleChange(newValue: number) {
    onChange?.(newValue)
  }

  return (
    <div className="flex items-end justify-between gap-x-4">
      {isImage ? (
        <Image
          className="h-12 w-12 rounded-md object-cover"
          src={imageURL}
          style={getBrightnessStyle(value)}
        />
      ) : (
        <div
          className="h-12 w-12 rounded-md object-cover"
          style={{
            backgroundImage: imageURL,
            ...getBrightnessStyle(value)
          }}
        />
      )}

      <div className="flex-1">
        <div className="mb-1 text-sm/6">{t('form.builder.settings.brightness')}</div>
        <Slider min={-100} max={100} value={value} onChange={handleChange} />
      </div>
    </div>
  )
}

export default ImageBrightness
