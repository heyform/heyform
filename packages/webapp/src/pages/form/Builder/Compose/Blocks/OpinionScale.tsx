import type { FC } from 'react'
import { useMemo } from 'react'

import { FakeRadio } from '../FakeRadio'
import type { BlockProps } from './Block'
import { Block } from './Block'

export const OpinionScale: FC<BlockProps> = ({ field, locale, ...restProps }) => {
  const indexes = useMemo(() => {
    return Array.from({ length: field.properties?.total || 10 }).map((_, index) => index + 1)
  }, [field.properties?.total])

  return (
    <Block className="heyform-opinion-scale" field={field} locale={locale} {...restProps}>
      <div className="flex items-center space-x-2">
        {indexes.map(index => (
          <FakeRadio label={index} key={index} />
        ))}
      </div>
      <div className="heyform-opinion-scale-labels">
        <div className="flex-1 text-left">{field.properties?.leftLabel}</div>
        <div className="flex-1 text-center">{field.properties?.centerLabel}</div>
        <div className="flex-1 text-right">{field.properties?.rightLabel}</div>
      </div>
    </Block>
  )
}
