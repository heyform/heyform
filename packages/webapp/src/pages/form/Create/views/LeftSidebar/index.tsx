import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

import { FieldList } from './FieldList'
import { HiddenFields } from './HiddenFields'
import { InsertFieldDropdown } from './InsertFieldDropdown'

const LeftSidebarComponent = () => {
  const { t } = useTranslation()

  return (
    <div className="left-sidebar flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center justify-between p-4">
        <h2>{t('formBuilder.Content')}</h2>
        <InsertFieldDropdown />
      </div>

      <PanelGroup className="flex-1" direction="vertical">
        <Panel defaultSize={70} maxSize={85}>
          <FieldList />
        </Panel>

        <PanelResizeHandle className="border-t border-slate-200" />

        <Panel defaultSize={20} maxSize={65}>
          <HiddenFields />
        </Panel>
      </PanelGroup>
    </div>
  )
}

export const LeftSidebar = memo(LeftSidebarComponent)
