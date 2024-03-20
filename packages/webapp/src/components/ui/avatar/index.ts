import type { FC } from 'react'

import type { AvatarProps } from './Avatar'
import Avatar from './Avatar'
import type { AvatarGroupProps } from './Group'
import Group from './Group'

type ExportAvatarType = FC<AvatarProps> & {
  Group: FC<AvatarGroupProps>
}

const ExportAvatar = Avatar as ExportAvatarType
ExportAvatar.Group = Group

export default ExportAvatar
