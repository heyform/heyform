import type { FC } from 'react'

import { Rate } from '@/components/ui'
import { RATING_SHAPE_CONFIG } from '@/pages/form/Create/consts'

import type { BlockProps } from './Block'
import { Block } from './Block'

export const Rating: FC<BlockProps> = ({ field, locale, ...restProps }) => {
  function characterRender(index: number) {
    return (
      <>
        {RATING_SHAPE_CONFIG[field.properties?.shape || 'star']}
        <span className="heyform-rate-index">{index}</span>
      </>
    )
  }

  return (
    <Block className="heyform-rating" field={field} locale={locale} {...restProps}>
      <Rate count={field.properties?.total || 5} itemRender={characterRender} />
    </Block>
  )
}
