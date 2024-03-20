import { observer } from 'mobx-react-lite'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Async } from '@/components'
import { Modal } from '@/components/ui'
import { AppService, FormService } from '@/service'
import { useStore } from '@/store'
import { useParam } from '@/utils'

import { CommonSettings } from './views/CommonSettings'

interface SettingsProps {
  appId?: string
  visible?: boolean
  onVisibleChange?: (visible: boolean) => void
}

export const Settings: FC<SettingsProps> = observer(({ appId, visible, onVisibleChange }) => {
  const { formId } = useParam()
  const integrationStore = useStore('integrationStore')
  const app = integrationStore.integratedApps.find(row => row.id === appId)
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()

  async function fetchIntegrations() {
    const [result1, result2] = await Promise.all([
      AppService.apps(),
      FormService.integrations(formId)
    ])

    integrationStore.setApps(result1)
    integrationStore.setIntegrations(result2)

    return true
  }

  function handleRequest(isLoading: boolean) {
    setLoading(isLoading)
  }

  function handleClose() {
    onVisibleChange?.(false)
  }

  return (
    <Modal
      visible={visible}
      maskClosable={true}
      showCloseIcon={true}
      confirmLoading={loading}
      onClose={handleClose}
    >
      <Async
        request={fetchIntegrations}
        className="pb-3 pt-8"
        deps={[formId]}
        cacheFirst={integrationStore.apps.length > 0}
      >
        {(() => {
          switch (app?.uniqueId) {
            case 'googleanalytics':
              return (
                <CommonSettings
                  app={app}
                  onRequest={handleRequest}
                  onFinish={handleClose}
                  options={[
                    {
                      name: 'trackingCode',
                      label: t('integration.trackingCode'),
                      placeholder: 'e.g. UA-XXXXX-Y',
                      description: (
                        <>
                          {t('integration.copyGoogle')}{' '}
                          <a
                            className="underline"
                            href="https://support.google.com/analytics/answer/1008080?hl=en#zippy=%2Cin-this-article"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t('integration.link')}
                          </a>
                        </>
                      ),
                      rules: [
                        {
                          required: true
                        }
                      ]
                    }
                  ]}
                />
              )

            case 'facebookpixel':
              return (
                <CommonSettings
                  app={app}
                  onRequest={handleRequest}
                  onFinish={handleClose}
                  options={[
                    {
                      name: 'trackingCode',
                      label: t('integration.PixelID'),
                      placeholder: 'e.g. 100xxxxxxxxxxxxx',
                      description: (
                        <>
                          {t('integration.copyId')}{' '}
                          <a
                            className="underline"
                            href="https://www.facebook.com/business/help/952192354843755?id=1205376682832142"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t('integration.findId')}
                          </a>
                        </>
                      ),
                      rules: [
                        {
                          required: true
                        }
                      ]
                    }
                  ]}
                />
              )

            case 'email':
              return (
                <CommonSettings
                  app={app}
                  onRequest={handleRequest}
                  onFinish={handleClose}
                  options={[
                    {
                      name: 'email',
                      label: t('login.Email'),
                      rules: [{ required: true, type: 'email' }]
                    }
                  ]}
                />
              )

            case 'webhook':
              return (
                <CommonSettings
                  app={app}
                  onRequest={handleRequest}
                  onFinish={handleClose}
                  options={[
                    {
                      name: 'webhook',
                      label: t('integration.labelWeb'),
                      rules: [
                        {
                          type: 'url',
                          required: true
                        }
                      ]
                    }
                  ]}
                />
              )
          }
        })()}
      </Async>
    </Modal>
  )
})
