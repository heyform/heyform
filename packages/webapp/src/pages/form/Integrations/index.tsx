import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import { getIntegrationAuth } from './utils'
import { AppService, FormService } from '@/services'
import { useParam, useQuery } from '@/utils'

import { Async, Repeat, useToast } from '@/components'
import { useAppStore, useFormStore } from '@/store'
import { AppType, IntegrationType } from '@/types'

import IntegrationItem from './IntegrationItem'
import IntegrationSettingsModal from './IntegrationSettingsModal'

const Skeleton = (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
    <Repeat count={5}>
      <div className="border-input cursor-default rounded-lg border px-4 py-6 text-sm">
        <div className="flex items-center justify-between">
          <div className="skeleton border-accent-light h-8 w-8 rounded-lg border" />
          <div className="skeleton h-8 w-14 rounded-lg"></div>
        </div>
        <div className="mt-2 py-[0.1875rem]">
          <div className="skeleton h-3.5 w-20 rounded-sm"></div>
        </div>
        <div className="mt-1 py-[0.1875rem]">
          <div className="skeleton h-3.5 w-full rounded-sm"></div>
        </div>
        <div className="mt-0.5 py-[0.1875rem]">
          <div className="skeleton h-3.5 w-2/5 rounded-sm"></div>
        </div>
      </div>
    </Repeat>
  </div>
)

export default function FormIntegrations() {
  const { t } = useTranslation()
  const { formId } = useParam()
  const query = useQuery()
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const { openModal } = useAppStore()
  const { integratedApps, setApps, setIntegrations } = useFormStore()

  // The OAuth2 callback redirects back here with the outcome
  function handleConnectResult(apps: AppType[], integrations: IntegrationType[]) {
    const app = apps.find(row => row.id === query.appId)

    if (!app || !(query.integrationConnected || query.integrationError)) {
      return
    }

    const integratedApp = {
      ...app,
      integration: integrations.find(row => row.appId === app.id)
    } as Any

    if (query.integrationConnected) {
      openModal('IntegrationSettingsModal', { app: integratedApp })
    } else {
      toast({
        title: t('components.error.title'),
        message: t(
          query.integrationError === 'access_denied'
            ? 'form.integrations.auth.accessDenied'
            : 'form.integrations.auth.connectFailed',
          { name: getIntegrationAuth(t, integratedApp).providerName }
        )
      })
    }

    navigate(location.pathname, { replace: true })
  }

  async function fetch() {
    const [apps, integrations] = await Promise.all([
      AppService.apps(),
      FormService.integrations(formId)
    ])

    setApps(apps)
    setIntegrations(integrations)
    handleConnectResult(apps, integrations)

    return true
  }

  return (
    <>
      <div className="mt-10 space-y-12 px-6">
        <Async fetch={fetch} refreshDeps={[formId]} loader={Skeleton}>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {integratedApps.map(app => (
              <IntegrationItem key={app.id} app={app} />
            ))}
          </ul>
        </Async>
      </div>

      <IntegrationSettingsModal />
    </>
  )
}
