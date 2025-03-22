import { useRequest } from 'ahooks'
import { Trans, useTranslation } from 'react-i18next'

import {
  Button,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  useToast
} from '@/components'
import { UserService } from '@/services'
import { useUserStore } from '@/store'
import { useRouter } from '@/utils'

export default function VerifyEmail() {
  const { t } = useTranslation()

  const router = useRouter()
  const toast = useToast()
  const { temporaryEmail, user } = useUserStore()

  const { loading: sendLoading, run: sendRun } = useRequest(
    async () => {
      if (user.isEmailVerified) {
        return router.redirect('/')
      }

      await UserService.emailVerificationCode()
    },
    {
      refreshDeps: [user.isEmailVerified],
      onError: err => {
        toast({
          title: t('components.error.title'),
          message: err.message
        })
      }
    }
  )

  const { loading: verifyLoading, run: verifyRun } = useRequest(
    async (code: string) => {
      await UserService.verifyEmail(code)
      router.redirect('/onboarding')
    },
    {
      manual: true
    }
  )

  return (
    <div className="mx-auto grid w-[21.875rem] gap-6 py-12 lg:py-0">
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">{t('verifyEmail.title')}</h1>
        <p className="text-sm text-secondary">
          {t('verifyEmail.subHeadline', { email: temporaryEmail })}
        </p>
      </div>

      <div className="mt-10">
        <InputOTP maxLength={6} loading={verifyLoading} onComplete={verifyRun}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>

        <p className="mt-4 text-center text-sm text-secondary">
          <Trans
            t={t}
            i18nKey="verifyEmail.resend"
            components={{
              button: (
                <Button.Link
                  className="!p-0 text-secondary underline hover:bg-transparent hover:text-primary"
                  loading={sendLoading}
                  onClick={sendRun}
                />
              )
            }}
          />
        </p>
      </div>
    </div>
  )
}
