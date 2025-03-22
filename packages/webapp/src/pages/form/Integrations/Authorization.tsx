import { useBoolean } from 'ahooks'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import IconGoogle from '@/assets/google.svg?react'
import { Button, Image } from '@/components'
import { IntegrationService } from '@/services'
import { useParam, useWindow } from '@/utils'

import { IntegrationSettingsFormProps } from './SettingsForm'

interface IntegrationAuthorizationProps extends IntegrationSettingsFormProps {
  fetch: (code: string) => Promise<void>
}

const POPUP_WINDOW_SOURCE = 'heyform-integration'

export default function IntegrationAuthorization({ app, fetch }: IntegrationAuthorizationProps) {
  const { t } = useTranslation()

  const { formId } = useParam()
  const [error, setError] = useState<Error>()
  const [loading, { setTrue, setFalse }] = useBoolean(false)

  const isGoogle = useMemo(
    () => app?.uniqueId === 'googledrive' || app?.uniqueId === 'googlesheets',
    [app?.uniqueId]
  )

  const openWindow = useWindow(
    POPUP_WINDOW_SOURCE,
    async (win, payload) => {
      win.close()

      if (payload.code) {
        await fetch(payload.code)
        setFalse()
      }
    },
    () => {
      setFalse()
    }
  )

  async function handleOauth() {
    setTrue()

    try {
      const url = await IntegrationService.oauthUrl(formId, app?.id as string)

      openWindow(url)
    } catch (err: any) {
      setError(err)
      setFalse()
    }
  }

  return (
    <div className="text-sm">
      <div className="font-medium">{t('form.integrations.authorization.headline')}</div>
      <div className="mb-1 text-secondary">{t('form.integrations.authorization.subHeadline')}</div>

      <Button.Ghost
        className="mt-4 w-full gap-x-2"
        size="md"
        loading={loading}
        onClick={handleOauth}
      >
        {isGoogle ? (
          <IconGoogle className="h-5 w-5 rounded-full" />
        ) : (
          <Image className="h-5 w-5 rounded-full object-cover" src={app?.avatar} />
        )}
        <span>
          {t('form.integrations.authorization.loginWith', {
            name: isGoogle ? 'Google' : app?.name
          })}
        </span>
      </Button.Ghost>

      {error && !loading && <div className="mt-1.5 text-sm/6 text-error">{error.message}</div>}
    </div>
  )
}
