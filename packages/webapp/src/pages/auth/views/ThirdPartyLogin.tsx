import { qs, removeObjectNil } from '@heyform-inc/utils'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { AppleIcon, GoogleIcon } from '@/components'
import { DISABLE_LOGIN_WITH_APPLE, DISABLE_LOGIN_WITH_GOOGLE } from '@/consts'
import { getBrowserId, useQuery, useRouter } from '@/utils'

interface ThirdPartyLoginProps {
  headline?: string
  subHeadline?: string
}

export const ThirdPartyLogin: FC<ThirdPartyLoginProps> = ({ headline, subHeadline }) => {
  const query = useQuery()
  const router = useRouter()
  const { t } = useTranslation()

  if (DISABLE_LOGIN_WITH_GOOGLE && DISABLE_LOGIN_WITH_APPLE) {
    return null
  }

  function handleRedirect(type: string) {
    const state = getBrowserId()
    const q = removeObjectNil({
      state,
      redirect_uri: query.redirect_uri
    })

    router.redirect(`/connect/${type}?${qs.stringify(q, { encode: true })}`)
  }

  function handleSignInWithApple() {
    handleRedirect('apple')
  }

  function handleSignInWithGoogle() {
    handleRedirect('google')
  }

  return (
    <div>
      <p className="text-sm font-medium text-slate-700"> {headline}</p>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {!DISABLE_LOGIN_WITH_GOOGLE && (
          <div>
            <div
              className="inline-flex w-full cursor-pointer justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm hover:bg-slate-50"
              onClick={handleSignInWithGoogle}
            >
              <span className="sr-only">{t('login.Google')}</span>
              <GoogleIcon className="h-5 w-5" />
            </div>
          </div>
        )}

        {!DISABLE_LOGIN_WITH_APPLE && (
          <div>
            <div
              className="inline-flex w-full cursor-pointer justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm hover:bg-slate-50"
              onClick={handleSignInWithApple}
            >
              <span className="sr-only">{t('login.Apple')}</span>
              <AppleIcon className="h-5 w-5" />
            </div>
          </div>
        )}
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-slate-500">{subHeadline}</span>
        </div>
      </div>
    </div>
  )
}
