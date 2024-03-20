import type { FC } from 'react'

import type { TabsPaneProps } from './Pane'
import Pane from './Pane'
import type { TabsProps } from './Tabs'
import Tabs from './Tabs'

type ExportTabsType = FC<TabsProps> & {
  Pane: FC<TabsPaneProps>
}

const ExportTabs = Tabs as ExportTabsType
ExportTabs.Pane = Pane

export default ExportTabs
