import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import IconApple from '@/assets/apple.svg?react'
import IconGoogle from '@/assets/google.svg?react'
import { Button, Divider } from '@/components'
import { getDeviceId, useRouter } from '@/utils'

interface SocialLoginProps {
  isSignUp?: boolean
}

const SocialLogin: FC<SocialLoginProps> = () => {
  const { t } = useTranslation()
  const router = useRouter()

  function handleConnect(type: string) {
    router.redirect(`/connect/${type}`, {
      query: {
        state: getDeviceId()
      },
      extend: true
    })
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <Button variant="outline" className="block w-full" onClick={() => handleConnect('google')}>
          <IconGoogle className="h-4 w-4" />
          <span>Google</span>
        </Button>

        <Button variant="outline" className="block w-full" onClick={() => handleConnect('apple')}>
          <IconApple className="-mt-0.5 h-4 w-4" />
          <span>Apple</span>
        </Button>
      </div>

      <Divider>{t('login.continueWith')}</Divider>
    </>
  )
}

export default SocialLogin
