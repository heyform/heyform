import { useEffect, useState } from 'react'
import { useParam } from '@/utils'
import { useTranslation } from 'react-i18next'

import { AnchorNavigation } from '@/components'

import WorkspaceApiDocumentation from './ApiDocumentation'
import WorkspaceApiKeys from './ApiKeys'
import BrandKitModal from './BrandKitModal'
import WorkspaceBranding from './Branding'
import WorkspaceConnectedAccounts from './ConnectedAccounts'
import WorkspaceDeletion from './Deletion'
import WorkspaceDeletionModal from './DeletionModal'
import WorkspaceGeneral from './General'

export default function WorkspaceSettings() {
  const { t } = useTranslation()
  const { workspaceId } = useParam()
  const [access, setAccess] = useState({ workspaceId: '', keys: false, docs: false })
  useEffect(() => {
    const controller = new AbortController()
    const base = '/api/v1/workspaces/' + encodeURIComponent(workspaceId) + '/api/'
    const check = (path: string) => fetch(base + path, { credentials: 'same-origin', cache: 'no-store', signal: controller.signal }).then(r => r.ok).catch(() => false)
    Promise.all([check('keys'), check('documentation')]).then(([keys, docs]) => {
      if (!controller.signal.aborted) setAccess({ workspaceId, keys, docs })
    })
    return () => controller.abort()
  }, [workspaceId])
  const keysEnabled = access.workspaceId === workspaceId && access.keys
  const docsEnabled = access.workspaceId === workspaceId && access.docs

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
                  ...(keysEnabled ? [{ label: 'API Keys', value: 'api-keys' }] : []),
                  ...(docsEnabled ? [{ label: 'API Documentation', value: 'api-documentation' }] : []),
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
              {keysEnabled && <WorkspaceApiKeys key={workspaceId} />}
              {docsEnabled && <WorkspaceApiDocumentation key={workspaceId} />}
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
