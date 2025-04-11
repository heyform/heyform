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

// Helper function to process avatar paths
function processImagePath(src: string, resize?: { width?: number; height?: number }) {
  // Check if it's a relative path (starts with slash but not http/https) - these are likely DB avatar paths
  if (src && src.startsWith('/') && !src.startsWith('//') && !src.startsWith('/static/')) {
    // This is likely a DB avatar path - prefix with API path to properly resolve it
    let avatarUrl = `/api/avatar${src}`

    // Add resize parameters directly to avatar URL if needed
    if (resize && (helper.isNumber(resize.width) || helper.isNumber(resize.height))) {
      const params: Record<string, string> = {}
      if (helper.isNumber(resize.width)) params.w = String(resize.width)
      if (helper.isNumber(resize.height)) params.h = String(resize.height)
      avatarUrl = getDecoratedURL(avatarUrl, params)
    }

    return avatarUrl
  }
  return src
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
    // Process avatar paths with resize parameters included
    const processedSrc = processImagePath(rawSrc as string, resize)

    // Only use the image API for actual URLs, not for avatar paths
    if (
      helper.isURL(processedSrc) &&
      !processedSrc.startsWith('/api/avatar') &&
      (helper.isNumber(width) || helper.isNumber(height))
    ) {
      return getDecoratedURL(
        '/api/image',
        removeObjectNil({
          url: processedSrc as string,
          w: width,
          h: height
        })
      )
    }

    return processedSrc
  }, [rawSrc, height, width])

  const isImage = useMemo(() => helper.isURL(src) || src?.startsWith('/api/avatar'), [src])

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
    // Process avatar paths with resize parameters included
    const processedSrc = processImagePath(rawSrc as string, resize)

    if (!helper.isValid(processedSrc)) {
      return undefined
    }

    // Only use the image API for actual URLs, not for avatar paths
    if (helper.isNumber(width) || helper.isNumber(height)) {
      if (!processedSrc.startsWith('/api/avatar')) {
        return getDecoratedURL(
          '/api/image',
          removeObjectNil({
            url: processedSrc as string,
            w: width,
            h: height
          })
        )
      }
    }

    return processedSrc
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
