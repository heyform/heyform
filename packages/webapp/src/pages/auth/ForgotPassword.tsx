import { useTranslation } from 'react-i18next'

import { RedirectUriLink } from '@/components'
import { Form, Input } from '@/components/ui'
import { AuthService } from '@/service'
import { useStore } from '@/store'
import { useQueryURL, useRouter } from '@/utils'

const ForgotPassword = () => {
  const router = useRouter()
  const appStore = useStore('appStore')
  const { t } = useTranslation()
  const nextURL = useQueryURL('/reset-password')

  async function handleFinish(values: IMapType) {
    await AuthService.sendResetEmail(values.email)
    appStore.resetPasswordEmail = values.email
    router.push(nextURL)
  }

  return (
    <div>
      <div>
        <h1 className="mt-6 text-center text-3xl font-bold text-slate-900">
          {t('auth.forgotPassword.forgot')}
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          {t('auth.forgotPassword.sendEmail')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <Form.Custom
            submitText={t('auth.forgotPassword.continue')}
            submitOptions={{
              type: 'primary',
              block: true
            }}
            request={handleFinish}
          >
            <Form.Item
              name="email"
              label={t('login.Email')}
              rules={[{ type: 'email', required: true, message: t('login.EmailRequired') }]}
            >
              <Input type="email" />
            </Form.Item>
          </Form.Custom>

          <div className="mt-6 text-center text-blue-700 hover:text-blue-800 sm:text-sm">
            <RedirectUriLink href="/login" className="inline-flex items-center">
              {t('auth.forgotPassword.link')}
            </RedirectUriLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
