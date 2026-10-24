import { useTranslation } from 'react-i18next'

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

          <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
            <div className="flex-1 p-6">
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
