import { useTranslation } from 'react-i18next'

import { AnchorNavigation } from '@/components'

import BrandKitModal from './BrandKitModal'
import WorkspaceBranding from './Branding'
import WorkspaceConnectedAccounts from './ConnectedAccounts'
import WorkspaceDeletion from './Deletion'
import WorkspaceDeletionModal from './DeletionModal'
import WorkspaceGeneral from './General'

export default function WorkspaceSettings() {
  const { t } = useTranslation()

  return (
    <>
      <div className="w-full">
        <div>
          <h1 className="text-2xl/8 font-semibold sm:text-xl/8">{t('settings.title')}</h1>

          <hr className="border-accent-light my-6 w-full border-t" />

          <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-16 lg:space-y-0">
            <aside className="-mx-3 lg:w-1/4">
              <AnchorNavigation
                menus={[
                  {
                    label: t('settings.general.title'),
                    value: 'general'
                  },
                  {
                    label: t('settings.branding.title'),
                    value: 'branding'
                  },
                  {
                    label: t('settings.connectedAccounts.title'),
                    value: 'connected-accounts'
                  },
                  {
                    label: t('settings.deletion.title'),
                    value: 'deletion'
                  }
                ]}
              />
            </aside>

            <div className="flex-1">
              <WorkspaceGeneral />
              <WorkspaceBranding />
              <WorkspaceConnectedAccounts />
              <WorkspaceDeletion />
            </div>
          </div>
        </div>
      </div>

      <BrandKitModal />
      <WorkspaceDeletionModal />
    </>
  )
}
