import { FieldLayoutAlignEnum } from '@heyform-inc/shared-types-enums'

import {
  LayoutCoverIcon,
  LayoutFloatLeftIcon,
  LayoutFloatRightIcon,
  LayoutInlineIcon,
  LayoutSplitLeftIcon,
  LayoutSplitRightIcon
} from '@/components'

export const LAYOUT_OPTIONS = [
  {
    value: FieldLayoutAlignEnum.INLINE,
    icon: <LayoutInlineIcon />
  },
  {
    value: FieldLayoutAlignEnum.FLOAT_LEFT,
    icon: <LayoutFloatLeftIcon />
  },
  {
    value: FieldLayoutAlignEnum.FLOAT_RIGHT,
    icon: <LayoutFloatRightIcon />
  },
  {
    value: FieldLayoutAlignEnum.SPLIT_LEFT,
    icon: <LayoutSplitLeftIcon />
  },
  {
    value: FieldLayoutAlignEnum.SPLIT_RIGHT,
    icon: <LayoutSplitRightIcon />
  },
  {
    value: FieldLayoutAlignEnum.COVER,
    icon: <LayoutCoverIcon />
  }
]
