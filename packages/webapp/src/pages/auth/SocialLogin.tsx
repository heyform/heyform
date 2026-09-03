import { IconBrandAppleFilled, IconLock } from '@tabler/icons-react'
import { FC, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { getDeviceId, useRouter } from '@/utils'

import IconGoogle from '@/assets/google.svg?react'
import { Button, Divider } from '@/components'
import {
  DISABLE_LOGIN_WITH_APPLE,
  DISABLE_LOGIN_WITH_GOOGLE,
  DISABLE_LOGIN_WITH_OIDC,
  OIDC_DISPLAY_NAME,
  OIDC_DISPLAY_ICON_URL,
  isRegistrationDisabled
} from '@/consts'

interface SocialLoginProps {
  isSignUp?: boolean
}

const SocialIcon: FC<{ children: ReactNode }> = ({ children }) => (
  <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center">
    {children}
  </span>
)

const SocialLogin: FC<SocialLoginProps> = ({ isSignUp }) => {
  const { t } = useTranslation()
  const router = useRouter()
  const providers = [
    !DISABLE_LOGIN_WITH_GOOGLE
      ? {
          id: 'google',
          label: 'Google',
          icon: (
            <SocialIcon>
              <IconGoogle className="block h-full w-full" />
            </SocialIcon>
          )
        }
      : null,
    !DISABLE_LOGIN_WITH_APPLE
      ? {
          id: 'apple',
          label: 'Apple',
          icon: (
            <SocialIcon>
              <IconBrandAppleFilled
                size={18}
                aria-hidden="true"
                className="shrink-0"
                color="currentColor"
              />
            </SocialIcon>
          )
        }
      : null,
    !DISABLE_LOGIN_WITH_OIDC
      ? {
          id: 'oidc',
          label: OIDC_DISPLAY_NAME,
          icon: OIDC_DISPLAY_ICON_URL
            ? <img src={OIDC_DISPLAY_ICON_URL} className="h-[18px] w-auto" alt="" />
            : (
              <SocialIcon>
                <IconLock size={18} aria-hidden="true" className="shrink-0" color="currentColor" />
              </SocialIcon>
            )
        }
      : null
  ].filter(Boolean) as Array<{ id: string; label: string; icon: ReactNode }>

  function handleConnect(type: string) {
    router.redirect(`/connect/${type}`, {
      query: {
        state: getDeviceId()
      },
      extend: true
    })
  }

  if (providers.length < 1 || (isSignUp && isRegistrationDisabled())) {
    return null
  }

  return (
    <>
      <div className={providers.length === 1 ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-2 gap-4'}>
        {providers.map((provider, index) => (
          <Button
            key={provider.id}
            variant="outline"
            className={
              providers.length > 1 && providers.length % 2 === 1 && index === providers.length - 1
                ? 'col-span-2 w-full'
                : 'w-full'
            }
            onClick={() => handleConnect(provider.id)}
          >
            {provider.icon}
            <span>{provider.label}</span>
          </Button>
        ))}
      </div>

      <Divider>{t('login.continueWith')}</Divider>
    </>
  )
}

export default SocialLogin
