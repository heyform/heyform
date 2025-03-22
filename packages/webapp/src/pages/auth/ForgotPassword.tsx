import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Form, Input } from '@/components'
import { AuthService } from '@/services'
import { useUserStore } from '@/store'
import { useRouter } from '@/utils'

const ForgotPassword = () => {
  const { t } = useTranslation()

  const router = useRouter()
  const { setTemporaryEmail } = useUserStore()

  async function fetch({ email }: any) {
    await AuthService.sendResetEmail(email)

    setTemporaryEmail(email)
    router.replace('/reset-password')
  }

  return (
    <div className="mx-auto grid w-[21.875rem] gap-6 py-12 lg:py-0">
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">{t('forgotPassword.title')}</h1>
        <p className="text-sm text-secondary">{t('forgotPassword.subHeadline')}</p>
      </div>

      <Form.Simple
        className="space-y-4"
        fetch={fetch}
        submitProps={{
          label: t('components.continue'),
          className: 'w-full'
        }}
      >
        <Form.Item
          name="email"
          label={t('login.email.label')}
          rules={[
            {
              required: true,
              message: t('login.email.required')
            },
            {
              type: 'email',
              message: t('login.email.invalid')
            }
          ]}
        >
          <Input type="email" />
        </Form.Item>
      </Form.Simple>

      <p className="text-center text-sm text-secondary">
        <Trans
          t={t}
          i18nKey="forgotPassword.toLogin"
          components={{
            a: <Link className="underline underline-offset-4 hover:text-primary" to="/login" />
          }}
        />
      </p>
    </div>
  )
}

export default ForgotPassword
