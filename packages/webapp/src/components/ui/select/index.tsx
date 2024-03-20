import type { FC } from 'react'

import Card, { SelectCardProps } from './Card'
import Cards, { SelectCardsProps } from './Cards'
import Custom from './Custom'
import type { MultipleSelectProps } from './Multiple'
import Multiple from './Multiple'
import type { SelectProps } from './Native'
import Native from './Native'

const Select: FC<SelectProps> = ({ native, ...restProps }) => {
  return native ? <Native {...restProps} /> : <Custom {...restProps} />
}

type ExportSelectType = FC<SelectProps> & {
  Multiple: FC<MultipleSelectProps>
  Cards: FC<SelectCardsProps>
  Card: FC<SelectCardProps>
}

const ExportSelect = Select as ExportSelectType
ExportSelect.Multiple = Multiple
ExportSelect.Cards = Cards
ExportSelect.Card = Card

export default ExportSelect
