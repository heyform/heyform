import clsx from 'clsx'
import { type FC, type ReactNode, useMemo } from 'react'

import { DefaultAvatarIcon } from '../icons'
import Image from '../image'
import { IComponentProps } from '../typing'

export interface AvatarProps extends IComponentProps {
  src?: string
  text?: string
  retainLength?: number
  size?: number
  circular?: boolean
  rounded?: boolean
  defaultIcon?: ReactNode
}

const Avatar: FC<AvatarProps> = ({
  className,
  style,
  src,
  text: rawText,
  retainLength = 1,
  size = 32,
  circular,
  rounded,
  defaultIcon,
  children,
  ...restProps
}) => {
  const text = useMemo(
    () =>
      rawText
        ?.split(/\s|-|_|#/)
        .map(w => w.charAt(0).toUpperCase())
        .slice(0, retainLength)
        .join(''),
    [rawText]
  )

  return (
    <span
      className={clsx(
        'avatar',
        {
          'avatar-circular': circular,
          'avatar-rounded': rounded
        },
        className
      )}
      style={style}
      {...restProps}
    >
      {src ? (
        <Image src={src} width={size} height={size} />
      ) : text ? (
        <span
          className="avatar-text"
          style={{
            lineHeight: `${size}px`
          }}
        >
          {text}
        </span>
      ) : (
        defaultIcon || <DefaultAvatarIcon className="avatar-placeholder" />
      )}
    </span>
  )
}

export default Avatar
