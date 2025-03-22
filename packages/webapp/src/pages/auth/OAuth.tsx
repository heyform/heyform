import { IconDots } from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import IconLogo from '@/assets/logo.svg?react'
import { Async, Button, Image, Loader } from '@/components'
import { AppService } from '@/services'
import { AppType } from '@/types'
import { useQuery } from '@/utils'

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
          <div className="h-12 w-12 rounded-lg border border-accent-light p-1.5">
            <IconLogo className="h-full w-full" />
          </div>

          <IconDots className="h-6 w-6 text-input" />

          <div className="relative h-12 w-12 p-1 after:absolute after:inset-0 after:rounded-lg after:border after:border-accent-light">
            <Image className="h-full w-full rounded-lg object-cover" src={app?.avatar} />
          </div>
        </div>

        <div className="mt-8">
          <h1 className="text-center text-2xl font-bold sm:tracking-tight">
            {t('oauth.headline', { name: app?.name })}
          </h1>
          <p className="mx-auto mt-1 max-w-3xl text-center text-sm/6 text-secondary">
            {t('oauth.subHeadline', { name: app?.name })}
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-lg rounded-lg bg-background/50 p-6">
          <h2 className="text-center text-base font-bold text-primary">
            {t('oauth.would', { name: app?.name })}
          </h2>

          <ul className="mt-6 space-y-4">
            <li>
              <div className="text-sm/6 font-medium text-primary">{t('oauth.scopes.0')}</div>
              <div className="text-sm text-secondary">{t('oauth.scopes.1')}</div>
            </li>

            <li>
              <div className="text-sm/6 font-medium text-primary">{t('oauth.scopes.2')}</div>
              <div className="text-sm text-secondary">{t('oauth.scopes.3')}</div>
            </li>

            <li>
              <div className="text-sm/6 font-medium text-primary">{t('oauth.scopes.4')}</div>
              <div className="text-sm text-secondary">{t('oauth.scopes.5')}</div>
            </li>

            <li>
              <div className="text-sm/6 font-medium text-primary">{t('oauth.scopes.6')}</div>
              <div className="text-sm text-secondary">{t('oauth.scopes.7')}</div>
            </li>

            <li>
              <div className="text-sm/6 font-medium text-primary">{t('oauth.scopes.8')}</div>
              <div className="text-sm text-secondary">{t('oauth.scopes.9')}</div>
            </li>
          </ul>

          <div className="mt-6">
            {error && !loading && <div className="mb-2 text-sm/6 text-error">{error.message}</div>}

            <Button className="w-full" size="md" loading={loading} onClick={run}>
              {t('oauth.title')}
            </Button>
          </div>
        </div>
      </div>
    </Async>
  )
}
