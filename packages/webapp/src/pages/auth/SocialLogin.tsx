import { IconBrandAppleFilled } from '@tabler/icons-react'
import { FC, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { getDeviceId, useRouter } from '@/utils'

import IconGoogle from '@/assets/google.svg?react'
import { Button, Divider } from '@/components'
import { DISABLE_EMAIL_LOGIN, DISABLE_LOGIN_WITH_APPLE, DISABLE_LOGIN_WITH_GOOGLE } from '@/consts'


interface SocialLoginProps {
  isSignUp?: boolean
}

const SocialIcon: FC<{ children: ReactNode }> = ({ children }) => (
  <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center">
    {children}
  </span>
)

const SocialLogin: FC<SocialLoginProps> = () => {
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

  if (providers.length < 1) {
    return null
  }

  return (
    <>
      <div className={providers.length === 1 ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-2 gap-4'}>
        {providers.map(provider => (
          <Button
            key={provider.id}
            variant="outline"
            className="w-full"
            onClick={() => handleConnect(provider.id)}
          >
            {provider.icon}
            <span>{provider.label}</span>
          </Button>
        ))}
      </div>

      {!DISABLE_EMAIL_LOGIN && <Divider>{t('login.continueWith')}</Divider>}
    </>
  )
}

export default SocialLogin
