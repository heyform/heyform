import { useTranslation } from 'react-i18next'

import { Async, Repeat } from '@/components'
import { INTEGRATION_CATEGORIES } from '@/consts'
import { AppService, FormService } from '@/services'
import { useFormStore } from '@/store'
import { useParam } from '@/utils'

import IntegrationItem from './IntegrationItem'
import IntegrationSettingsModal from './SettingsModal'

const Skeleton = (
  <div>
    <div className="py-1">
      <div className="skeleton h-4 w-24 rounded-sm"></div>
    </div>

    <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
      <Repeat count={5}>
        <div className="cursor-default rounded-lg border border-input px-4 py-6 text-sm">
          <div className="flex items-center justify-between">
            <div className="skeleton h-8 w-8 rounded-lg border border-accent-light" />
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
  </div>
)

export default function FormIntegrations() {
  const { t } = useTranslation()

  const { formId } = useParam()
  const { integratedApps, setApps, setIntegrations } = useFormStore()

  async function fetch() {
    const [apps, integrations] = await Promise.all([
      AppService.apps(),
      FormService.integrations(formId)
    ])

    setApps(apps)
    setIntegrations(integrations)

    return true
  }

  return (
    <>
      <div className="mt-10 space-y-12">
        <Async fetch={fetch} refreshDeps={[formId]} loader={Skeleton}>
          {INTEGRATION_CATEGORIES.map(cat => (
            <div key={cat.value}>
              <h2 className="text-base/6 font-semibold">{t(cat.label)}</h2>

              <ul className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
                {integratedApps
                  .filter(app => app.category === cat.value)
                  .map(app => (
                    <IntegrationItem key={app.id} app={app} />
                  ))}
              </ul>
            </div>
          ))}
        </Async>
      </div>

      <IntegrationSettingsModal />
    </>
  )
}
