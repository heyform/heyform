import { helper, removeObjectNil } from '@heyform-inc/utils'
import { FC, ImgHTMLAttributes, SyntheticEvent, useMemo, useState } from 'react'

import { cn, getDecoratedURL } from '@/utils'

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  resize?: {
    width?: number
    height?: number
  }
}

interface BackgroundProps extends ComponentProps {
  as?: any
  src?: string
  resize?: {
    width?: number
    height?: number
  }
}

const Background: FC<BackgroundProps> = ({
  as: Tag = 'div',
  className,
  src: rawSrc,
  resize = {},
  children,
  style,
  ...restProps
}) => {
  const { width, height } = resize

  const src = useMemo(() => {
    if (helper.isURL(rawSrc) && (helper.isNumber(width) || helper.isNumber(height))) {
      return getDecoratedURL(
        '/api/image',
        removeObjectNil({
          url: rawSrc as string,
          w: width,
          h: height
        })
      )
    }

    return rawSrc
  }, [rawSrc, height, width])

  const isImage = useMemo(() => helper.isURL(src), [src])

  return (
    <Tag
      className={className}
      style={{
        ...style,
        backgroundImage: isImage ? `url(${src})` : src
      }}
      {...restProps}
    >
      {children}
    </Tag>
  )
}

const isURL = (url: string) => /^https?:\/\//i.test(url)

const ImageComponent: FC<ImageProps> = ({
  className,
  src: rawSrc,
  resize = {},
  onLoad,
  onError,
  ...restProps
}) => {
  const [isLoaded, setLoaded] = useState(false)
  const { width, height } = resize

  const src = useMemo(() => {
    if (!isURL(rawSrc as string)) {
      return
    }

    if (helper.isNumber(width) || helper.isNumber(height)) {
      return getDecoratedURL(
        '/api/image',
        removeObjectNil({
          url: rawSrc as string,
          w: width,
          h: height
        })
      )
    }

    return rawSrc
  }, [rawSrc, height, width])

  function handleLoad(event: SyntheticEvent<HTMLImageElement, Event>) {
    setLoaded(true)
    onLoad?.(event)
  }

  function handleError(event: SyntheticEvent<HTMLImageElement, Event>) {
    setLoaded(false)
    onError?.(event)
  }

  return (
    <img
      key={src}
      className={cn('bg-accent object-cover data-[loaded]:bg-transparent', className)}
      data-loaded={isLoaded ? '' : undefined}
      src={src}
      onLoad={handleLoad}
      onError={handleError}
      {...restProps}
    />
  )
}

export const Image = Object.assign(ImageComponent, {
  Background
})
