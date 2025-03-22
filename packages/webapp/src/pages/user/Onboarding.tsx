import { helper } from '@heyform-inc/utils'
import { useEffect, useState } from 'react'

import { Loader } from '@/components'
import { ONBOARDING_FORM_URL, REDIRECT_COOKIE_NAME, WEBSITE_URL } from '@/consts'
import { UserService } from '@/services'
import { useUserStore } from '@/store'
import { clearCookie, getCookie, useRouter } from '@/utils'

export default function Onboarding() {
  const router = useRouter()
  const { user, updateUser } = useUserStore()

  const [isLoaded, setIsLoaded] = useState(false)
  const redirectUri = getCookie(REDIRECT_COOKIE_NAME) as string

  function handleLoad() {
    setIsLoaded(true)
  }

  async function handleMessage(event: MessageEvent) {
    if (
      event.origin === WEBSITE_URL &&
      helper.isObject(event.data) &&
      event.data.source === 'HEYFORM' &&
      event.data.eventName === 'FORM_SUBMITTED'
    ) {
      const result = await UserService.update({
        isOnboarded: true
      })

      if (result) {
        updateUser({
          isOnboarded: true
        })

        if (helper.isValid(redirectUri)) {
          clearCookie(REDIRECT_COOKIE_NAME)

          router.redirect(redirectUri, {
            extend: false
          })
        } else {
          router.replace('/')
        }
      }
    }
  }

  useEffect(() => {
    if (helper.isValid(user) && user.isOnboarded) {
      router.replace('/')
    }
  }, [user])

  useEffect(() => {
    window.addEventListener('message', handleMessage, false)

    return () => {
      window.removeEventListener('message', handleMessage, false)
    }
  }, [])

  return (
    <div className="h-screen w-screen">
      <iframe
        className="h-full w-full"
        src={`${ONBOARDING_FORM_URL}?email=${user?.email}`}
        onLoad={handleLoad}
      />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <Loader className="h-6 w-6" />
        </div>
      )}
    </div>
  )
}
