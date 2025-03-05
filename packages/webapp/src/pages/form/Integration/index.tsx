import { observer } from 'mobx-react-lite'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Async, Heading, SubHeading } from '@/components'
import { Spin } from '@/components/ui'
import { AppService, FormService } from '@/service'
import { useStore } from '@/store'
import { useParam } from '@/utils'

import { AppItem } from './views/AppItem'
import { Settings } from './views/Settings'

interface CategoryItemProps {
  name: string
}

const INTEGRATION_CATEGORIES = ['Reporting', 'Analytics']

const CategoryItem: FC<CategoryItemProps> = ({ name }) => {
  const { t } = useTranslation()

  function handleClick() {
    document.getElementById(name)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

  return (
    <div
      className="block cursor-pointer px-3 py-2 font-normal text-[#4e5d78]"
      onClick={handleClick}
    >
      {t(name)}
    </div>
  )
}

const Integration: FC = observer(() => {
  const { t } = useTranslation()
  const { formId } = useParam()
  const integrationStore = useStore('integrationStore')
  const [selectedAppId, setSelectedAppId] = useState<string | undefined>()
  const [visible, setVisible] = useState(false)

  async function fetchIntegrations() {
    const [result1, result2] = await Promise.all([
      AppService.apps(),
      FormService.integrations(formId)
    ])

    integrationStore.setApps(result1)
    integrationStore.setIntegrations(result2)

    return true
  }

  function handleClick(app: any) {
    setSelectedAppId(app.id)
    setVisible(true)
  }

  console.log(integrationStore.integratedApps, "integrationStore.integratedApps");
  
  return (
    <div className="form-content-container">
      <div className="flex justify-center">
        <div className="hidden w-[280px] md:block">
          <div className="sticky top-10 mt-20 rounded-[3px] bg-white p-5">
            <div className="px-3 py-2 text-gray-600">{t('integration.Categories')}</div>
            {INTEGRATION_CATEGORIES.map((name, index) => (
              <CategoryItem key={index} name={name} />
            ))}
          </div>
        </div>

        <div className="mx-4 mb-16 mt-20 w-full rounded-[3px] md:ml-16 md:mr-0 md:w-[700px]">
          <Heading
            description={
              <>
                {t('integration.connectText')}&nbsp;
                <a href="https://docs.heyform.net" target="_blank">
                  {t('integration.help')}
                </a>
                &nbsp;
                {t('integration.helpApp')}
              </>
            }
          >
            {t('integration.Integrations')}
          </Heading>

          <Async
            request={fetchIntegrations}
            deps={[formId]}
            cacheFirst={integrationStore.apps.length > 0}
            skeleton={<Spin />}
          >
            {INTEGRATION_CATEGORIES.map((category, index) => (
              <div className="mb-4" key={index}>
                <SubHeading className="mb-6 pt-9" id={category}>
                  {t(category)}
                </SubHeading>
                {integrationStore.integratedApps
                  .filter(app => app.category === category)
                  .map((app, index) => (
                    <AppItem
                      key={index}
                      app={app}
                      onClick={handleClick}
                      // onDelete={fetchIntegrations}
                    />
                  ))}
              </div>
            ))}
          </Async>
        </div>

        <Settings appId={selectedAppId} visible={visible} onVisibleChange={setVisible} />
      </div>
    </div>
  )
})

export default Integration
