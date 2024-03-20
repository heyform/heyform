import { helper } from '@heyform-inc/utils'
import { FC, ImgHTMLAttributes, useMemo } from 'react'

import { urlBuilder } from '@/utils'

interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'width' | 'height'> {
  crop?: boolean
  width?: number
  height?: number
}

export function cropImage(src?: string, width = 0, height = 0): string | undefined {
  if (helper.isURL(src)) {
    return urlBuilder('/image', {
      url: src,
      w: width,
      h: height
    })
  }
}

const Image: FC<ImageProps> = ({
  src: rawSrc,
  crop = true,
  width,
  height,
  alt = '',
  ...restProps
}) => {
  const src = useMemo(
    () => (crop ? cropImage(rawSrc, width, height) : rawSrc),
    [crop, rawSrc, width, height]
  )

  return <img src={src} alt={alt} {...restProps} />
}

export default Image
