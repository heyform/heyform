import { FC, useState } from 'react'

import { cn } from '@/utils'

import { Image, ImageProps } from './Image'

interface AvatarProps extends ComponentProps, Pick<ImageProps, 'resize'> {
  src?: string
  fallback?: string
}

function getFirstLetters(str: string) {
  return str
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83E[\uDD10-\uDDFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF])/g,
      ''
    )
    .split(' ')
    .map(word => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export const Avatar: FC<AvatarProps> = ({
  className,
  src,
  fallback = '',
  resize,
  ...restProps
}) => {
  const [isLoaded, setLoaded] = useState(false)

  return (
    <div
      className={cn(
        'relative h-10 w-10 select-none after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:border after:border-input',
        className
      )}
      {...restProps}
    >
      {!isLoaded && (
        <span
          className="flex h-full w-full items-center justify-center rounded-full bg-accent text-primary dark:text-zinc-950"
          data-slot="fallback"
        >
          {getFirstLetters(fallback)}
        </span>
      )}

      {src && (
        <Image
          className="hidden aspect-square h-full w-full rounded-full object-cover data-[loaded]:block"
          data-slot="image"
          data-loaded={isLoaded ? '' : undefined}
          src={src}
          alt={fallback}
          resize={resize}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(false)}
        />
      )}
    </div>
  )
}
