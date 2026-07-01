import { IconDots } from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AppService } from '@/services'
import { useQuery } from '@/utils'

import IconLogoPng from '@/assets/logo.png'
import { Async, Button, Image, Loader } from '@/components'
import { AppType } from '@/types'

export default function OAuth() {
  const { t } = useTranslation()

  const { client_id, redirect_uri, state } = useQuery()
  const [app, setApp] = useState<AppType>()

  async function fetch() {
    setApp(await AppService.detail(client_id, redirect_uri))

    return true
  }

  const { loading, error, run } = useRequest(
    async () => {
      const res = await AppService.authorizationCode(client_id, redirect_uri)

      window.location.href = `${res}&state=${state}`
    },
    {
      refreshDeps: [client_id, redirect_uri, state],
      manual: true
    }
  )

  return (
    <Async
      fetch={fetch}
      refreshDeps={[client_id, redirect_uri, state]}
      loader={
        <div className="flex justify-center">
          <Loader />
        </div>
      }
    >
      <div className="flex flex-col justify-center">
        <div className="flex items-center justify-center gap-x-4">
          <div className="border-accent-light h-12 w-12 rounded-lg border p-1.5">
            <img src={IconLogoPng} className="h-full w-full" alt="Logisaar Forms" />
          </div>

          <IconDots className="text-input h-6 w-6" />

          <div className="after:border-accent-light relative h-12 w-12 p-1 after:absolute after:inset-0 after:rounded-lg after:border">
            <Image className="h-full w-full rounded-lg object-cover" src={(app as any)?.avatar || app?.icon} />
          </div>
        </div>

        <div className="mt-8">
          <h1 className="text-center text-2xl font-bold sm:tracking-tight">
            {t('oauth.headline', { name: app?.name })}
          </h1>
          <p className="text-secondary mx-auto mt-1 max-w-3xl text-center text-sm/6">
            {t('oauth.subHeadline', { name: app?.name })}
          </p>
        </div>

        <div className="bg-background/50 mx-auto mt-12 max-w-lg rounded-lg p-6">
          <h2 className="text-primary text-center text-base font-bold">
            {t('oauth.would', { name: app?.name })}
          </h2>

          <ul className="mt-6 space-y-4">
            <li>
              <div className="text-primary text-sm/6 font-medium">{t('oauth.scopes.0')}</div>
              <div className="text-secondary text-sm">{t('oauth.scopes.1')}</div>
            </li>

            <li>
              <div className="text-primary text-sm/6 font-medium">{t('oauth.scopes.2')}</div>
              <div className="text-secondary text-sm">{t('oauth.scopes.3')}</div>
            </li>

            <li>
              <div className="text-primary text-sm/6 font-medium">{t('oauth.scopes.4')}</div>
              <div className="text-secondary text-sm">{t('oauth.scopes.5')}</div>
            </li>

            <li>
              <div className="text-primary text-sm/6 font-medium">{t('oauth.scopes.6')}</div>
              <div className="text-secondary text-sm">{t('oauth.scopes.7')}</div>
            </li>

            <li>
              <div className="text-primary text-sm/6 font-medium">{t('oauth.scopes.8')}</div>
              <div className="text-secondary text-sm">{t('oauth.scopes.9')}</div>
            </li>
          </ul>

          <div className="mt-6">
            {error && !loading && <div className="text-error mb-2 text-sm/6">{error.message}</div>}

            <Button className="w-full" size="md" loading={loading} onClick={run}>
              {t('oauth.title')}
            </Button>
          </div>
        </div>
      </div>
    </Async>
  )
}
