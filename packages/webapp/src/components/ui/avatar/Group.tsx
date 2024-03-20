import clsx from 'clsx'
import type { FC, HTMLAttributes } from 'react'
import { useMemo } from 'react'

import type { AvatarProps } from './Avatar'
import Avatar from './Avatar'

export type AvatarOptionType = Partial<
  Pick<AvatarProps, 'src' | 'text' | 'retainLength' | 'circular' | 'rounded'>
>

export interface AvatarGroupProps
  extends Partial<Pick<AvatarProps, 'size' | 'circular' | 'rounded'>>,
    HTMLAttributes<HTMLElement> {
  avatarClassName?: string
  options?: AvatarOptionType[]
  maximum?: number
}

const Group: FC<AvatarGroupProps> = ({
  className,
  avatarClassName,
  options: rawOptions,
  size,
  circular,
  rounded,
  children,
  maximum,
  ...restProps
}) => {
  const options = useMemo(() => {
    const opts: AvatarOptionType[] = rawOptions || []

    if (maximum && opts!.length > maximum) {
      const len = opts.length

      opts.splice(maximum, len - maximum)
      opts.push({
        text: `+${len - maximum}`
      })
    }

    return opts
  }, [rawOptions, maximum])

  return (
    <span className={clsx('avatar-group', className)} {...restProps}>
      {options.map((option, index) => (
        <Avatar
          key={index}
          className={avatarClassName}
          src={option.src}
          text={option.text}
          retainLength={2}
          size={size}
          circular={circular ?? option.circular}
          rounded={rounded ?? option.rounded}
        />
      ))}
      {children}
    </span>
  )
}

export default Group
