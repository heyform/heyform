import { useTranslation } from 'react-i18next'

import { RedirectUriLink } from '@/components'
import { Form, Input } from '@/components/ui'
import { AuthService } from '@/service'
import { useQueryURL, useRouter } from '@/utils'

import { ThirdPartyLogin } from './views/ThirdPartyLogin'

const Login = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const nextURL = useQueryURL('/')

  async function handleFinish(values: any) {
    await AuthService.login(values.email, values.password)
    router.redirect(nextURL)
  }

  return (
    <div>
      <div>
        <h1 className="mt-6 text-center text-3xl font-bold text-slate-900">{t('login.signIn')}</h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          {t('login.logIn')} {''} {t('login.or')} {''}
          <RedirectUriLink
            href="/sign-up"
            className="font-medium text-blue-700 hover:text-blue-800"
          >
            {t('login.startFree')}
          </RedirectUriLink>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <Form.Custom
            submitText={t('login.button')}
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

            <Form.Item
              name="password"
              label={
                <div className="flex items-center justify-between">
                  <span>{t('login.Password')}</span>
                  <RedirectUriLink
                    href="/forgot-password"
                    className="text-sm font-medium text-blue-700 hover:text-blue-800"
                  >
                    {t('login.forgotPassword')}
                  </RedirectUriLink>
                </div>
              }
              rules={[{ required: true, message: t('login.PasswordRequired') }]}
            >
              <Input.Password />
            </Form.Item>
          </Form.Custom>

          <div className="relative mb-4 mt-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-slate-500">{t('login.continueWith')}</span>
            </div>
          </div>

          <div>
            <ThirdPartyLogin />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
