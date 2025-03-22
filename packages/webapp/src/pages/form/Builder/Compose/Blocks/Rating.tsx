import { RATING_SHAPE_ICONS, Rate } from '@heyform-inc/form-renderer'
import type { FC } from 'react'

import type { BlockProps } from './Block'
import { Block } from './Block'

export const Rating: FC<BlockProps> = ({ field, locale, ...restProps }) => {
  function characterRender(index: number) {
    const Shape = RATING_SHAPE_ICONS[field.properties?.shape || 'star']

    return (
      <>
        {Shape}
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
